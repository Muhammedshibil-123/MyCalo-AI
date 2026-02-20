import os
from datetime import date
import chromadb
from chromadb.config import Settings
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.utilities import SQLDatabase
from langchain_chroma import Chroma
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from config import settings

class NutritionHistoryInput(BaseModel):
    user_query: str = Field(description="The exact query about the user's food, meals, calories, macros, or exercises.")
    user_id: int = Field(description="The ID of the user. Always pass this exactly as provided.")

class AppNavigationInput(BaseModel):
    query: str = Field(description="The user's question about how to use the app, navigation, or policies.")

class GroqHybridAgent:
    def __init__(self):
        self.groq_key = settings.GROQ_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.db = None
        self.vectorstore = None
        
        # Groq Fallback Chain
        self.models_chain = [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768"
        ]
        
        self.llm = self._initialize_groq_llm()
        self.agent_executor = self._create_agent()

    def _initialize_groq_llm(self):
        print("[GROQ] Initializing Agent LLM with high-speed failovers...")
        primary_llm = ChatGroq(model=self.models_chain[0], groq_api_key=self.groq_key, temperature=0.0)
        fallbacks = [ChatGroq(model=m, groq_api_key=self.groq_key, temperature=0.0) for m in self.models_chain[1:]]
        return primary_llm.with_fallbacks(fallbacks)

    def _init_database(self):
        if self.db is None:
            try:
                db_uri = f"postgresql+psycopg2://postgres:{settings.DATABASE_PASSWORD}@mycalo_db:5432/mycalo_ai_db"
                self.db = SQLDatabase.from_uri(db_uri, include_tables=["tracking_dailylog", "foods_fooditem", "exercises_exercise"])
                print("[DATABASE] ✓ Successfully connected to PostgreSQL")
                return True
            except Exception as e:
                print(f"[DB ERROR]: {e}")
                return False
        return True

    def _init_vectorstore(self):
        if self.vectorstore is None:
            try:
                # Still using Google for embeddings (the Map)
                embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=self.gemini_key)
                chroma_client = chromadb.HttpClient(host="chromadb", port=8000, settings=Settings(anonymized_telemetry=False))
                self.vectorstore = Chroma(client=chroma_client, collection_name="mycalo_app_knowledge", embedding_function=embeddings)
                print("[CHROMA DB] ✓ Successfully connected to Vector Store")
                return True
            except Exception as e:
                print(f"[VECTOR ERROR]: {e}")
                return False
        return True

    async def _query_database_tool_logic(self, user_query: str, user_id: int) -> str:
        print(f"[ACTION] User {user_id} requested SQL data: '{user_query}'")
        if not self._init_database(): return "Database unavailable."
        
        current_date = date.today().strftime("%Y-%m-%d")
        sql_prompt = f"""Generate ONLY raw PostgreSQL. User ID: {user_id}, Date: {current_date}, Query: {user_query}
        Tables: 
        1. tracking_dailylog (user_id, food_item_id, user_serving_grams, meal_type, date)
        2. foods_fooditem (id, name, calories, protein, carbohydrates, fat)
        3. exercises_exercise (id, name, met_value)
        Rules: Filter by user_id={user_id}. meal_type is uppercase. Use ILIKE. Math: (grams/100.0)*value."""
        
        try:
            res = await self.llm.ainvoke(sql_prompt)
            sql = res.content.replace("```sql", "").replace("```", "").strip()
            print(f"[SQL QUERY GENERATED]: {sql}")
            
            result = self.db.run(sql)
            print(f"[SQL DATA RETRIEVED]: {result}")
            
            return f"Data: {result}. Summarize this for the user." if result else "No records found."
        except Exception as e:
            print(f"[SQL ERROR]: {e}")
            return f"SQL Error: {e}"

    async def _search_app_tool_logic(self, query: str) -> str:
        print(f"[ACTION] Searching ChromaDB for: '{query}'")
        if not self._init_vectorstore(): return "Knowledge base offline."
        
        docs = self.vectorstore.similarity_search(query, k=3)
        print(f"[CHROMA DB RETRIEVED]: Found {len(docs)} relevant documents")
        
        return f"Manual Context: {' '.join([d.page_content for d in docs])}"

    def _create_agent(self):
        tools = [
            StructuredTool.from_function(coroutine=self._query_database_tool_logic, name="fetch_nutrition_history", description="Check food/exercise logs.", args_schema=NutritionHistoryInput),
            StructuredTool.from_function(coroutine=self._search_app_tool_logic, name="search_app_manual", description="Check app documentation.", args_schema=AppNavigationInput)
        ]
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are the MyCalo Groq Assistant. Answer in 2-10 lines. If pain/medical mentioned, advise seeing a doctor. Be concise."),
            ("human", "User ID: {user_id}\nQuestion: {input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])
        return AgentExecutor(agent=create_tool_calling_agent(self.llm, tools, prompt), tools=tools, verbose=True)

    async def process_query(self, user_query: str, user_id: int) -> str:
        print(f"\n[AGENT START] Message from User {user_id}: {user_query}")
        response = await self.agent_executor.ainvoke({"input": user_query, "user_id": user_id})
        
        # Check if tools were used by looking at the agent's verbose output log or response context
        if "fetch_nutrition_history" not in str(response) and "search_app_manual" not in str(response):
            print("[AGENT INFO] Handled as a normal message (Internal Knowledge)")
            
        return response["output"]