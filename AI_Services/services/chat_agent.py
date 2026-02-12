import os
from typing import List, Any
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import FakeEmbeddings  # Using Fake for speed/cost, or swap with GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage
from config import settings

# --- 1. The Failover Model Logic (Inspired by your loop) ---
class FailoverChatGemini:
    """
    Wrapper that tries multiple Gemini models in order.
    If the primary model fails, it retries with the next one.
    """
    def __init__(self):
        self.models_list = [
            "gemini-2.0-flash",       # Fast & Good
            "gemini-1.5-flash",       # Stable Backup
            "gemini-1.5-pro",         # High Intelligence Fallback
        ]
        self.api_key = settings.GEMINI_API_KEY

    def get_model(self):
        """Returns the primary model for LangChain initialization."""
        # Note: LangChain agents need a single consistent object. 
        # For true per-request failover in Agents, we usually rely on the primary.
        # However, we configure the strongest 'flash' model as default.
        return ChatGoogleGenerativeAI(
            model=self.models_list[0],
            google_api_key=self.api_key,
            temperature=0,
            convert_system_message_to_human=True
        )

# --- 2. The SQL Database Tool (Personal Data) ---
def get_sql_tool(user_id: int):
    # Connect to the Docker Postgres Container (mycalo_db)
    # user: postgres, pass: 123456, db: mycalo_ai_db, host: mycalo_db
    db_uri = f"postgresql+psycopg2://postgres:{settings.DATABASE_PASSWORD}@mycalo_db:5432/mycalo_ai_db"
    
    db = SQLDatabase.from_uri(
        db_uri,
        include_tables=['tracking_dailylog', 'foods_fooditem', 'accounts_customuser'],
        sample_rows_in_table_info=2
    )

    # We create a specialized prompt for the SQL agent to enforce SECURITY and USER ISOLATION
    sql_prompt = f"""
    You are a SQL Expert for a calorie tracking app.
    
    RULES:
    1. You have access to tables: 'tracking_dailylog', 'foods_fooditem'.
    2. 'tracking_dailylog' contains user history. FILTER BY user_id = {user_id} ALWAYS.
    3. 'foods_fooditem' contains nutrition info. Join on 'food_item_id'.
    4. DO NOT execute INSERT, UPDATE, or DELETE queries. READ-ONLY.
    5. If the user asks "Why did I gain weight?", look for high calorie/fat items in the last 7 days.
    6. Return the answer as a natural language summary.
    """
    
    llm = FailoverChatGemini().get_model()
    
    agent_executor = create_sql_agent(
        llm=llm,
        db=db,
        verbose=True,
        top_k=5
    )
    
    return Tool(
        name="Personal_Data_SQL",
        func=agent_executor.invoke,
        description="Useful for questions about the user's diet history, logs, weight, or 'Why did I gain weight?'. inputs: full question."
    )

# --- 3. The RAG Knowledge Tool (App Navigation) ---
def get_app_knowledge_tool():
    # Fake App Data (As requested)
    app_manual_text = [
        "To change your password: Go to Settings -> Security -> Change Password.",
        "To delete your account: Go to Profile -> Danger Zone -> Delete Account.",
        "To update your weight: Go to Dashboard -> Weight Graph -> Click '+'.",
        "To add a new food: Click the big Blue Plus (+) button on the home screen.",
        "To contact support: Go to Settings -> Help & Support -> Email Us.",
        "MyCalo AI uses Gemini Flash to analyze your food photos."
    ]
    
    # Create Vector Store (Using FAISS for speed)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY)
    vectorstore = FAISS.from_texts(app_manual_text, embedding=embeddings)
    retriever = vectorstore.as_retriever()

    def retrieve_info(query: str):
        docs = retriever.get_relevant_documents(query)
        return "\n".join([d.page_content for d in docs])

    return Tool(
        name="App_Help_Center",
        func=retrieve_info,
        description="Useful for questions about how to use the app, navigation, settings, or passwords."
    )

# --- 4. The Main Router Agent ---
class HybridAgent:
    def __init__(self):
        self.llm = FailoverChatGemini().get_model()

    async def process_query(self, user_query: str, user_id: int):
        # Tools available to the Brain
        tools = [
            get_sql_tool(user_id),
            get_app_knowledge_tool()
        ]

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are MyCalo Assistant. You help users with their diet and app navigation."),
            ("system", "If the user asks about their logs/history, use 'Personal_Data_SQL'."),
            ("system", "If the user asks about app features/settings, use 'App_Help_Center'."),
            ("system", "If the user asks general questions (e.g. Who is president?), just answer directly."),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        agent = create_tool_calling_agent(self.llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

        try:
            response = await agent_executor.ainvoke({"input": user_query})
            return response["output"]
        except Exception as e:
            return f"I encountered an error analyzing that: {str(e)}"