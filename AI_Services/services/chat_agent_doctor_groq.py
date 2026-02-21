import os
from datetime import date

import chromadb
from chromadb.config import Settings
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import StructuredTool
from langchain_chroma import Chroma
from langchain_community.utilities import SQLDatabase
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

from config import settings


# --- 1. Define Tool Schemas ---
class PatientNutritionHistoryInput(BaseModel):
    user_query: str = Field(
        description="The exact query about the patient's food, meals, calories, macros, or exercises."
    )
    user_id: int = Field(
        description="The ID of the patient (user_id). Always pass this exactly as provided."
    )


class AppNavigationInput(BaseModel):
    query: str = Field(
        description="The doctor's question about platform guidelines, medical disclaimers, or app usage."
    )


# --- 2. The Agent Class ---
class DoctorGroqAgent:
    def __init__(self):
        # Using the specific Doctor Groq API Key
        self.groq_key = settings.DOC_GROQ_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.db = None
        self.vectorstore = None

        # Groq Fallback Chain for high availability
        self.models_chain = [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
        ]

        self.llm = self._initialize_groq_llm()
        self.agent_executor = self._create_agent()

    def _initialize_groq_llm(self):
        print("[GROQ DOCTOR] Initializing Doctor Agent LLM...")
        primary_llm = ChatGroq(
            model=self.models_chain[0], groq_api_key=self.groq_key, temperature=0.0
        )
        fallbacks = [
            ChatGroq(model=m, groq_api_key=self.groq_key, temperature=0.0)
            for m in self.models_chain[1:]
        ]
        return primary_llm.with_fallbacks(fallbacks)

    def _init_database(self):
        """Lazy initialization of the SQL database connection"""
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
                )
                print(
                    "[DATABASE] ✓ Successfully connected to PostgreSQL for Doctor Agent"
                )
                return True
            except Exception as e:
                print(f"[DB ERROR]: {e}")
                return False
        return True

    def _init_vectorstore(self):
        """Lazy initialization of the Vector store connection"""
        if self.vectorstore is None:
            try:
                embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/gemini-embedding-001", google_api_key=self.gemini_key
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
                    "[CHROMA DB] ✓ Successfully connected Vector Store for Doctor Agent"
                )
                return True
            except Exception as e:
                print(f"[VECTOR ERROR]: {e}")
                return False
        return True

    # --- 3. Tool Logic ---
    async def _query_database_tool_logic(self, user_query: str, user_id: int) -> str:
        """Generates and executes SQL to find patient diet/exercise logs"""
        print(f"[ACTION] Doctor requesting Patient {user_id} SQL: '{user_query}'")
        if not self._init_database():
            return "Database unavailable."

        current_date = date.today().strftime("%Y-%m-%d")

        # EXACT SAME PROMPT RULES as user chat, but labeled for "Patient" and "Doctor Request"
        sql_prompt = f"""Generate a clean PostgreSQL query for Patient ID {user_id}.
        Current Date: {current_date}
        Doctor Request: {user_query}
        
        TABLES:
        - tracking_dailylog (user_id, food_item_id, user_serving_grams, meal_type, date)
        - foods_fooditem (id, name, calories, protein, carbohydrates, fat)
        
        STRICT SQL RULES:
        1. Always filter by user_id = {user_id}.
        2. Filter by date = '{current_date}' unless another date is specified.
        3. IMPORTANT: The meal_type column in the DB is UPPERCASE. Always use: UPPER(t1.meal_type) = 'BREAKFAST' (or LUNCH/DINNER/SNACK).
        4. Do NOT search food names (t2.name ILIKE) unless specifically asked for a food item.
        5. Return ONLY the raw SQL string. No markdown, no explanations."""

        try:
            res = await self.llm.ainvoke(sql_prompt)
            sql = (
                res.content.strip().replace("```sql", "").replace("```", "").rstrip(";")
            )

            # Safety check: ensure the AI didn't add markdown
            if sql.startswith("SELECT") is False:
                sql = sql[sql.find("SELECT") :]

            print(f"[SQL GENERATED]: {sql}")

            result = self.db.run(sql)
            print(f"[SQL DATA RETRIEVED]: {result}")

            # IMPROVED STOP SIGNAL: Clearer instruction to the agent to stop looping
            if not result or result == "[]" or result == "[(None,)]":
                return f"FINAL_ANSWER: The database contains zero records for patient {user_id} on {current_date}. Do not call any more tools."

            return f"Database Results: {result}. Summarize this for the doctor professionally."
        except Exception as e:
            print(f"[SQL ERROR]: {e}")
            return "I encountered an error accessing the patient's diet logs."

    async def _search_app_tool_logic(self, query: str) -> str:
        """Searches the vector store for app logic or clinical guidelines (if added)"""
        print(f"[ACTION] Searching ChromaDB for: '{query}'")
        if not self._init_vectorstore():
            return "Knowledge base offline."

        docs = self.vectorstore.similarity_search(query, k=3)
        print(f"[CHROMA DB RETRIEVED]: Found {len(docs)} relevant documents")

        context = "\n\n".join([d.page_content for d in docs])
        return f"App/Clinical Context: {context}"

    # --- 4. Agent Setup ---
    def _create_agent(self):
        """Builds the reasoning loop using the working configurations from the User chat"""
        tools = [
            StructuredTool.from_function(
                coroutine=self._query_database_tool_logic,
                name="fetch_patient_nutrition_history",
                description="Look up the patient's logged food, calories, or exercise history from the database. Use this when the doctor asks about what the patient ate or logged.",
                args_schema=PatientNutritionHistoryInput,
            ),
            StructuredTool.from_function(
                coroutine=self._search_app_tool_logic,
                name="search_platform_guidelines",
                description="Look up platform guidelines or general MyCalo app information.",
                args_schema=AppNavigationInput,
            ),
        ]

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are the MyCalo Clinical AI Assistant designed to help Doctors.
            - Your role is to assist doctors in analyzing their patient's dietary, macro, and exercise logs.
            - You will be provided with the Patient's User ID. Use this ID to fetch records using your tools.
            - If you need info from a tool, call it exactly once.
            - If a tool returns 'no records', do not try again; inform the doctor.
            - Keep final answers to 2-10 lines maximum. No markdown titles.
             
             -(if asked normal questions like how are you then reply to that (basically be professional but friendly for normal questions))
            - OUT-OF-SCOPE: If a doctor asks about general knowledge (politics, history, celebrities, etc.), politely decline. 
              Example: "I am your MyCalo Clinical Assistant. I am here to help analyze patient data, so I cannot provide information on topics outside of that scope."
             """,
                ),
                ("human", "Patient ID: {user_id}\nDoctor's Inquiry: {input}"),
                ("placeholder", "{agent_scratchpad}"),
            ]
        )

        agent = create_tool_calling_agent(self.llm, tools, prompt)
        return AgentExecutor(agent=agent, tools=tools, verbose=True)

    # --- 5. Main Entry Point ---
    async def process_query(self, user_query: str, user_id: int) -> str:
        """Called by the FastAPI Router"""
        try:
            print(
                f"\n[DOCTOR AGENT START] Query regarding Patient {user_id}: {user_query}"
            )
            response = await self.agent_executor.ainvoke(
                {"input": user_query, "user_id": user_id}
            )

            # Log if it was handled without tools
            if "fetch_patient_nutrition_history" not in str(
                response
            ) and "search_platform_guidelines" not in str(response):
                print("[AGENT INFO] Handled using internal AI knowledge.")

            return response["output"]

        except Exception as e:
            print(f"[CRITICAL AGENT ERROR]: {str(e)}")
            return "I'm having trouble connecting to the patient database right now."
