import os
from datetime import date

import chromadb
from chromadb.config import Settings
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import StructuredTool
from langchain_chroma import Chroma
from langchain_community.utilities import SQLDatabase
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import (  # Updated import
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)
from pydantic import BaseModel, Field

from config import settings


# --- 1. Define Tool Schemas ---
class NutritionHistoryInput(BaseModel):
    user_query: str = Field(
        description="The exact query about the user's food, meals, calories, macros, or exercises."
    )
    user_id: int = Field(
        description="The ID of the user. Always pass this exactly as provided."
    )


class AppNavigationInput(BaseModel):
    query: str = Field(
        description="The user's question about how to use the app, navigation, or policies."
    )


# --- 2. The Agent Class ---
class HybridAgent:
    def __init__(self):
        self.api_key = settings.BACKUP_GEMINI_KEY or settings.GEMINI_API_KEY
        self.db = None
        self.vectorstore = None

        # User-defined model fallback chain
        self.models_chain = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.5-pro",
        ]

        # Initialize the LLM with automatic failovers for quota protection
        self.llm = self._initialize_llm_with_fallbacks()

        # Initialize the LangChain Agent
        self.agent_executor = self._create_agent()

    def _initialize_llm_with_fallbacks(self):
        """Creates an LLM that automatically switches models if quota or 404 error occurs."""
        print("[LLM] Initializing Agent LLM with instant failovers...")

        primary_llm = ChatGoogleGenerativeAI(
            model=self.models_chain[0],
            google_api_key=self.api_key,
            temperature=0.0,
            max_retries=0,
        )

        fallbacks = [
            ChatGoogleGenerativeAI(
                model=m, google_api_key=self.api_key, temperature=0.0, max_retries=0
            )
            for m in self.models_chain[1:]
        ]

        return primary_llm.with_fallbacks(fallbacks, exceptions_to_handle=(Exception,))

    def _init_database(self):
        """Initialize database lazily"""
        if self.db is None:
            try:
                db_uri = f"postgresql+psycopg2://postgres:{settings.DATABASE_PASSWORD}@mycalo_db:5432/mycalo_ai_db"
                self.db = SQLDatabase.from_uri(
                    db_uri,
                    include_tables=[
                        "tracking_dailylog",
                        "foods_fooditem",
                        "exercises_exercise",
                    ],
                    sample_rows_in_table_info=1,
                )
                print("[DB] ✓ Connected to PostgreSQL")
                return True
            except Exception as e:
                print(f"[DB ERROR]: {e}")
                return False
        return True

    def _init_vectorstore(self):
        """Initialize ChromaDB with Google Cloud embeddings"""
        if self.vectorstore is None:
            try:
                # Switched from local HuggingFace to Google Cloud Embeddings
                embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/gemini-embedding-001", google_api_key=self.api_key
                )

                chroma_client = chromadb.HttpClient(
                    host="chromadb",
                    port=8000,
                    settings=Settings(anonymized_telemetry=False),
                )

                self.vectorstore = Chroma(
                    client=chroma_client,
                    collection_name="mycalo_app_knowledge",
                    embedding_function=embeddings,
                )
                print(
                    "[VECTOR] ✓ Connected to ChromaDB container using Google Embeddings"
                )
                return True
            except Exception as e:
                print(f"[VECTOR ERROR]: {e}")
                return False
        return True

    async def _query_database_tool_logic(self, user_query: str, user_id: int) -> str:
        """Executed when the Agent decides to look up user food or exercise history."""
        print(f"[TOOL] Triggered Database Lookup for User {user_id}")
        if not self._init_database():
            return "Error: Database temporarily unavailable."

        current_date = date.today().strftime("%Y-%m-%d")

        sql_prompt = f"""Generate a PostgreSQL query.
        Current Date: {current_date}
        User ID: {user_id}
        User Question: "{user_query}"

        Schema:
        Table 1: tracking_dailylog (user_id, food_item_id, user_serving_grams, meal_type, date)
        Table 2: foods_fooditem (id, name, calories, protein, carbohydrates, fat)
        Table 3: exercises_exercise (id, name, met_value)

        Strict Rules:
        1. FOR USER LOGS: ALWAYS filter by WHERE user_id = {user_id} when querying tracking_dailylog.
        2. MEAL TYPES: The meal_type column ONLY contains uppercase values: 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'.
        3. FOR GENERAL KNOWLEDGE: If asking about general food stats or exercise MET values, query foods_fooditem or exercises_exercise directly (DO NOT join with tracking_dailylog or filter by user_id).
        4. TEXT SEARCH: Always use ILIKE for case-insensitive text matching (e.g., name ILIKE '%Running%').
        5. MACROS: All nutrition columns (calories, protein, carbohydrates, fat) are stored per 100g. Calculate actual macros using: (user_serving_grams/100.0) * value.
        6. Return ONLY valid PostgreSQL code. No markdown formatting.
        
        PostgreSQL Query:"""

        try:
            response = await self.llm.ainvoke(sql_prompt)
            sql = (
                response.content.replace("```sql", "")
                .replace("```", "")
                .strip()
                .rstrip(";")
            )
            print(f"[TOOL SQL GENERATED]:\n{sql}")

            result = self.db.run(sql)
            print(f"[TOOL DB RESULT]: {result}")

            if not result or result == "[]" or str(result) == "[(None,)]":
                return "Database returned no results. Tell the user they haven't logged any data for this."

            return f"Raw Database Result: {result}. Please summarize this naturally to the user."

        except Exception as e:
            print(f"[TOOL ERROR]: {e}")
            return "Failed to query the database."

    async def _search_app_tool_logic(self, query: str) -> str:
        """Executed when the Agent decides to look up app documentation."""
        print(f"[TOOL] Triggered Vector Search for query: {query}")
        if not self._init_vectorstore():
            return "Vector database unavailable."

        try:
            docs = self.vectorstore.similarity_search(query, k=3)
            context = "\n\n".join([d.page_content for d in docs])
            return f"App Documentation Found:\n{context}\n\nUse this information to answer the user."
        except Exception as e:
            print(f"[TOOL ERROR]: {e}")
            return "Vector search failed."

    def _create_agent(self):
        """Builds the Agent with its brain and tools."""

        sql_tool = StructuredTool.from_function(
            coroutine=self._query_database_tool_logic,
            name="fetch_nutrition_history",
            description="USE THIS FIRST if the user asks about what they ate, their past meals, calories consumed, food logs, or exercises.",
            args_schema=NutritionHistoryInput,
        )

        app_tool = StructuredTool.from_function(
            coroutine=self._search_app_tool_logic,
            name="search_app_manual",
            description="USE THIS FIRST if the user asks how to navigate the app, change password, delete account, or app policies.",
            args_schema=AppNavigationInput,
        )

        tools = [sql_tool, app_tool]

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are the MyCalo AI Assistant. 
            
STRICT RULES FOR YOUR RESPONSES:
1. LENGTH: You MUST answer in 2 to 10 concise lines maximum. No essays. No markdown titles.
2. ACCURACY: NEVER guess or hallucinate. If the database returns no data, explicitly say "You haven't logged any data for this."
3. MEDICAL: If a user mentions pain (like stomach pain) or asks for medical advice, state firmly that you are an AI and they should consult a doctor, but you can list the foods they ate.
4. TOOLS: Use 'fetch_nutrition_history' for food/exercise logs. Use 'search_app_manual' for app navigation.

Do your job quickly and concisely.""",
                ),
                ("human", "User ID: {user_id}\nQuestion: {input}"),
                ("placeholder", "{agent_scratchpad}"),
            ]
        )

        agent = create_tool_calling_agent(self.llm, tools, prompt)
        return AgentExecutor(agent=agent, tools=tools, verbose=True)

    async def process_query(self, user_query: str, user_id: int) -> str:
        """Called by the FastAPI Router"""
        try:
            print(f"\n[AGENT START] Processing query for User {user_id}")
            response = await self.agent_executor.ainvoke(
                {"input": user_query, "user_id": user_id}
            )
            return response["output"]

        except Exception as e:
            print(f"[CRITICAL AGENT ERROR] {str(e)}")
            return "I'm having a little trouble connecting to my systems right now."
