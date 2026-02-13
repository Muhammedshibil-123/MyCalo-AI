import os
import re
from typing import Optional
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.utilities import SQLDatabase
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from config import settings

# YOUR models in YOUR priority order - will try ALL of them
MODEL_PRIORITY = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


class HybridAgent:
    def __init__(self):
        self.api_key = settings.BACKUP_GEMINI_KEY or settings.GEMINI_API_KEY
        self.db = None
        self.vectorstore = None
        self.current_model = None
        self.model_index = 0

    def _try_next_model(self):
        """Try to initialize the next model in the priority list"""
        while self.model_index < len(MODEL_PRIORITY):
            model_name = MODEL_PRIORITY[self.model_index]
            try:
                print(f"[LLM] Trying model {self.model_index + 1}/{len(MODEL_PRIORITY)}: {model_name}")
                
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=self.api_key,
                    temperature=0.2,
                )
                
                # Test if it works
                test_response = llm.invoke("Hi")
                
                self.current_model = llm
                print(f"[LLM] ✓ Successfully connected to: {model_name}")
                return True
                
            except Exception as e:
                error_str = str(e)
                print(f"[LLM] ✗ {model_name} failed: {error_str[:100]}")
                self.model_index += 1
                continue
        
        print(f"[LLM] ✗✗✗ ALL {len(MODEL_PRIORITY)} models failed!")
        return False

    async def _call_llm_async(self, prompt: str, max_retries: int = None):
        """Async LLM call with automatic failover - PROPERLY ASYNC"""
        if max_retries is None:
            max_retries = len(MODEL_PRIORITY)
        
        attempts = 0
        
        while attempts < max_retries:
            try:
                # Make sure we have a working model
                if self.current_model is None:
                    if not self._try_next_model():
                        raise Exception("No working models available")
                
                # Use ASYNC invoke
                response = await self.current_model.ainvoke(prompt)
                return response.content
                
            except Exception as e:
                error_str = str(e)
                print(f"[LLM ERROR] {error_str[:150]}")
                
                # Check if it's a quota error
                if "429" in error_str or "quota" in error_str.lower():
                    print(f"[LLM] → Quota exceeded, switching to next model...")
                    self.model_index += 1
                    self.current_model = None
                    
                    if not self._try_next_model():
                        raise Exception("All models quota exceeded")
                    
                    attempts += 1
                    continue
                else:
                    attempts += 1
                    if attempts >= max_retries:
                        raise
                    continue
        
        raise Exception(f"Failed after {attempts} attempts")

    def _init_database(self):
        """Initialize database lazily"""
        if self.db is None:
            try:
                db_uri = f"postgresql+psycopg2://postgres:{settings.DATABASE_PASSWORD}@mycalo_db:5432/mycalo_ai_db"
                self.db = SQLDatabase.from_uri(
                    db_uri,
                    include_tables=["tracking_dailylog", "foods_fooditem"],
                    sample_rows_in_table_info=1,
                )
                print("[DB] Connected to PostgreSQL")
                return True
            except Exception as e:
                print(f"[DB ERROR]: {e}")
                return False
        return True

    def _init_vectorstore(self):
        """Initialize vector store lazily - FIXED MODEL NAME"""
        if self.vectorstore is None:
            try:
                # CORRECT: Use "text-embedding-004" not "models/text-embedding-004"
                embeddings = GoogleGenerativeAIEmbeddings(
                    model="text-embedding-004",  # ← FIXED!
                    google_api_key=self.api_key
                )

                # Compact app knowledge
                docs = [
                    "To change your password: Go to Settings menu, tap Security section, then tap Change Password",
                    "To delete your account: Go to Profile, scroll down to Danger Zone, tap Delete Account",
                    "To add food: Tap the big blue Plus (+) button on the home screen bottom",
                    "To contact support: Open Settings menu, tap Help & Support section, then tap Email Us",
                    "To view reports: Open the Analytics tab from bottom navigation menu",
                    "To navigate settings: Tap menu icon top-right, select Settings from dropdown",
                    "To update profile: Go to Profile tab, tap Edit Profile button",
                    "Password reset: Settings > Security > Change Password > Enter old and new password",
                ]

                self.vectorstore = FAISS.from_texts(docs, embedding=embeddings)
                print("[VECTOR] Initialized successfully")
                return True
            except Exception as e:
                print(f"[VECTOR ERROR]: {e}")
                return False
        return True

    def _classify_query_fast(self, query: str) -> str:
        """Fast keyword-based classification with PRIORITY"""
        query_lower = query.lower()

        # HIGH PRIORITY: App navigation keywords (check FIRST)
        high_priority_app_keywords = [
            "how to change password",
            "change password",
            "reset password", 
            "navigate to",
            "find the button",
            "where is the",
            "how do i",
            "where can i",
            "how to use",
            "how to delete",
            "how to contact",
            "how to add food",
            "settings menu",
            "navigation",
        ]
        
        # Check high priority app phrases first
        for phrase in high_priority_app_keywords:
            if phrase in query_lower:
                print(f"[CLASSIFY] APP (matched: '{phrase}')")
                return "APP"

        # MEDIUM PRIORITY: SQL keywords - actual diet/food questions
        sql_keywords = [
            "what did i eat",
            "what i ate",
            "what i eat",
            "how much protein",
            "how much calorie",
            "total calories",
            "total protein",
            "my meals",
            "yesterday",
            "today lunch",
            "today breakfast",
            "today dinner",
            "last week",
            "stomach pain",
            "why am i gaining weight",
        ]
        
        # Check SQL phrases
        for phrase in sql_keywords:
            if phrase in query_lower:
                print(f"[CLASSIFY] SQL (matched: '{phrase}')")
                return "SQL"

        # LOW PRIORITY: Single word keywords
        app_single_words = ["password", "setting", "button", "account", "delete", "support"]
        sql_single_words = ["eat", "ate", "meal", "food", "calorie", "protein", "carb"]
        
        # Count matches
        app_matches = sum(1 for word in app_single_words if word in query_lower)
        sql_matches = sum(1 for word in sql_single_words if word in query_lower)
        
        if app_matches > sql_matches:
            print(f"[CLASSIFY] APP (score: {app_matches} vs SQL: {sql_matches})")
            return "APP"
        elif sql_matches > 0:
            print(f"[CLASSIFY] SQL (score: {sql_matches} vs APP: {app_matches})")
            return "SQL"

        # Default to general
        print(f"[CLASSIFY] GENERAL (no strong matches)")
        return "GENERAL"

    async def process_query(self, user_query: str, user_id: int) -> str:
        """Main processing with optimized routing"""
        try:
            # Fast classification
            query_type = self._classify_query_fast(user_query)
            print(f"[ROUTE] {query_type} - Query: {user_query}")

            # Route to appropriate handler
            if query_type == "SQL":
                return await self._handle_sql(user_query, user_id)
            elif query_type == "APP":
                return await self._handle_app(user_query)
            else:
                return await self._handle_general(user_query)

        except Exception as e:
            print(f"[ERROR] {str(e)}")
            error_str = str(e).lower()
            if "quota" in error_str or "429" in error_str:
                return "I've reached my daily limit. Please try again in a few minutes."
            else:
                return "I'm having trouble right now. Please try again shortly."

    async def _handle_sql(self, query: str, user_id: int) -> str:
        """Handle SQL queries - IMPROVED"""
        if not self._init_database():
            return "Database temporarily unavailable. Please try again."

        # IMPROVED SQL prompt
        sql_prompt_text = f"""You are a SQL expert. Generate a PostgreSQL query.

Database Schema:
- tracking_dailylog: user_id, food_item_id, user_serving_grams, meal_type, date, created_at
- foods_fooditem: id, name, calories, protein, carbohydrates, fat, fiber, sugar (all per 100g)

CRITICAL RULES:
1. ALWAYS filter: WHERE user_id = {user_id}
2. ALWAYS JOIN: tracking_dailylog.food_item_id = foods_fooditem.id
3. Calculate actual nutrition: (user_serving_grams / 100.0) * nutrition_per_100g
4. For "today": date = CURRENT_DATE
5. For "yesterday": date = CURRENT_DATE - 1
6. For "lunch/breakfast/dinner": meal_type = 'LUNCH'/'BREAKFAST'/'DINNER'
7. ALWAYS include food name in SELECT

User Question: {query}

Generate ONLY the SQL query (no explanation):"""

        try:
            # Generate SQL
            sql = await self._call_llm_async(sql_prompt_text)
            sql = sql.replace("```sql", "").replace("```", "").strip()
            sql = sql.rstrip(';').strip()

            print(f"[SQL GENERATED]:\n{sql}")

            # Execute
            result = self.db.run(sql)
            print(f"[SQL RESULT]: {result}")

            # Check if empty
            if not result or result == "[]" or result == "" or "0 rows" in str(result):
                return f"I couldn't find any food logs for that query. Make sure you've logged some meals!"

            # Interpretation
            interpret = f"""User asked: "{query}"

Database returned: {result}

Provide a friendly 2-3 sentence answer about what they ate. Include food names and amounts."""

            response = await self._call_llm_async(interpret)
            return response

        except Exception as e:
            print(f"[SQL ERROR]: {e}")
            return f"I had trouble querying your food logs. Please try again."

    async def _handle_app(self, query: str) -> str:
        """Handle app questions - IMPROVED"""
        print("[APP] Attempting to use vector database...")
        
        if not self._init_vectorstore():
            print("[APP] Vector DB failed, using direct LLM response")
            # Fallback: Direct answer about app navigation
            prompt = f"""You are MyCalo Assistant helping with app navigation.

User question: {query}

Provide step-by-step instructions on how to do this in the MyCalo app. 
Be specific about which menus and buttons to tap.
Keep it brief (2-3 sentences)."""
            
            response = await self._call_llm_async(prompt)
            return response

        try:
            print("[APP] Searching vector database...")
            # Get relevant docs
            docs = self.vectorstore.similarity_search(query, k=3)
            context = "\n".join([d.page_content for d in docs])
            
            print(f"[APP] Found context:\n{context}")

            # Generate response with context
            prompt = f"""You are MyCalo Assistant helping with app navigation.

User question: {query}

Relevant app instructions:
{context}

Provide clear, step-by-step instructions based on this information.
Be specific and concise (2-3 sentences)."""

            response = await self._call_llm_async(prompt)
            return response

        except Exception as e:
            print(f"[APP ERROR]: {e}")
            # Fallback
            return await self._handle_general(query)

    async def _handle_general(self, query: str) -> str:
        """Handle general questions"""
        try:
            prompt = f"You are MyCalo Assistant, a nutrition AI. Answer briefly (2-3 sentences):\n\n{query}"
            response = await self._call_llm_async(prompt)
            return response
        except Exception as e:
            print(f"[GENERAL ERROR]: {e}")
            return "I'm having trouble responding right now. Please try again."