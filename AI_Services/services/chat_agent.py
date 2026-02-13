import os
import asyncio
from typing import List, Any
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import Tool
from config import settings

# --- Configuration ---
# Models ordered by Preference: Best -> Fastest -> Stable Backup
MODEL_PRIORITY = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


# --- 1. The SQL Database Tool (Personal Data) ---
def get_sql_tool(user_id: int, llm_instance):
    """
    Creates a SQL tool linked to the specific LLM instance provided.
    """
    # Connect to the Docker Postgres Container
    db_uri = f"postgresql+psycopg2://postgres:{settings.DATABASE_PASSWORD}@mycalo_db:5432/mycalo_ai_db"

    db = SQLDatabase.from_uri(
        db_uri,
        include_tables=["tracking_dailylog", "foods_fooditem", "accounts_customuser"],
        sample_rows_in_table_info=2,
    )

    # ENHANCED PROMPT: Handles Dates, Aggregations, and Symptoms
    sql_prompt = f"""
    You are a Data Analyst for a nutrition app.
    
    YOUR GOAL: Answer the user's question based strictly on their database records.

    ACCESS RULES:
    1. 'tracking_dailylog' has user history (date, meal_type, food_item_id).
    2. 'foods_fooditem' has nutrition (calories, protein, carbs, fats).
    3. ALWAYS FILTER by `user_id = {user_id}` in 'tracking_dailylog'.
    4. JOIN 'tracking_dailylog' with 'foods_fooditem' on `food_item_id`.
    
    INTELLIGENT ANALYSIS RULES:
    - **Time Windows:** - "Last week" = `date >= CURRENT_DATE - INTERVAL '7 days'`
      - "Yesterday" = `date = CURRENT_DATE - INTERVAL '1 day'`
    - **Totals:** If asked for "Total Protein", use SUM(foods_fooditem.protein).
    - **Symptoms/Health:** If user asks "Why does my stomach hurt?" or "Why did I gain weight?":
      - Query the LAST 3 DAYS of logs.
      - Look for: High sugar, high fat, spicy foods, or dairy.
      - Return a summary of suspect foods.
    
    OUTPUT: Return the answer as a natural, helpful sentence. Do not show SQL code unless asked.
    """

    agent_executor = create_sql_agent(llm=llm_instance, db=db, verbose=True, top_k=10)

    return Tool(
        name="Personal_Data_SQL",
        func=agent_executor.invoke,
        description="Use this for ANY question about diet history, past meals, nutrition totals (protein/calories), weight logs, or analyzing reasons for health symptoms based on past eating.",
    )


# --- 2. The RAG Knowledge Tool (App Navigation) ---
def get_app_knowledge_tool():
    """
    Re-initializes the vector store in-memory to prevent serialization errors.
    """
    app_manual_text = [
        "To change your password: Go to Settings -> Security -> Change Password.",
        "To delete your account: Go to Profile -> Danger Zone -> Delete Account.",
        "To update your weight: Go to Dashboard -> Weight Graph -> Click '+'.",
        "To add a new food: Click the big Blue Plus (+) button on the home screen.",
        "To contact support: Go to Settings -> Help & Support -> Email Us.",
        "MyCalo AI uses Gemini Flash to analyze your food photos.",
        "To view reports: Go to the Analytics tab to see weekly breakdowns.",
    ]

    try:
        # Use Google Embeddings
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY
        )

        # Create fresh VectorStore
        vectorstore = FAISS.from_texts(app_manual_text, embedding=embeddings)
        retriever = vectorstore.as_retriever()

        def retrieve_info(query: str):
            docs = retriever.invoke(query)
            return "\n".join([d.page_content for d in docs])

        return Tool(
            name="App_Help_Center",
            func=retrieve_info,
            description="Use this ONLY for questions about how to use the app, finding buttons, settings, or account management.",
        )
    except Exception as e:
        print(f"[VECTOR DB ERROR] Failed to init: {e}")
        # Fallback tool if VectorDB fails
        return Tool(
            name="App_Help_Center",
            func=lambda x: "I'm having trouble accessing the help manual right now.",
            description="Fallback help tool.",
        )


# --- 3. The Hybrid Agent (With True Failover) ---
class HybridAgent:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    async def process_query(self, user_query: str, user_id: int):
        last_error = None

        # --- FAILOVER LOOP ---
        for model_name in MODEL_PRIORITY:
            try:
                print(f"[CHAT AGENT] Attempting with model: {model_name}")

                # 1. Initialize LLM for this attempt
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=self.api_key,
                    temperature=0.3,
                    convert_system_message_to_human=True,
                )

                # 2. Initialize Tools (Pass LLM to SQL Agent so it uses the active model)
                sql_tool = get_sql_tool(user_id, llm)
                rag_tool = get_app_knowledge_tool()
                tools = [sql_tool, rag_tool]

                # 3. Create Agent Prompt
                prompt = ChatPromptTemplate.from_messages(
                    [
                        (
                            "system",
                            """You are MyCalo Assistant, a smart nutritionist and app guide.
                    
                    ROUTING LOGIC:
                    - **Diet/Health/History:** If the user asks about what they ate, nutrient totals (protein/fats), weight, or physical symptoms ("stomach pain"), YOU MUST USE 'Personal_Data_SQL'.
                    - **App Usage:** If user asks how to change settings/password, USE 'App_Help_Center'.
                    - **General:** If user asks general questions (e.g. "Is apple healthy?"), answer directly using your knowledge.
                    
                    Tone: Friendly, encouraging, and professional.
                    """,
                        ),
                        ("human", "{input}"),
                        ("placeholder", "{agent_scratchpad}"),
                    ]
                )

                # 4. Create and Run Agent
                agent = create_tool_calling_agent(llm, tools, prompt)
                agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

                # 5. Execute
                response = await agent_executor.ainvoke({"input": user_query})
                return response["output"]

            except Exception as e:
                error_msg = str(e)
                print(f"[FAIL] {model_name} failed: {error_msg}")
                last_error = error_msg

                # If it's a specific 'quota' or 'resource exhausted' error, continue loop.
                # If it's a logic error, we might still want to try a 'pro' model.
                continue

        # If all models fail
        return f"I apologize, but my servers are currently overloaded (All models failed). Please try again in 1 minute. (Debug: {last_error})"
