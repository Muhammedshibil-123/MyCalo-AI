import os
import re
from typing import Optional
import chromadb
from chromadb.config import Settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import SQLDatabase
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from config import settings

# YOUR models in YOUR priority order
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
        """Async LLM call with automatic failover"""
        if max_retries is None:
            max_retries = len(MODEL_PRIORITY)
        
        attempts = 0
        
        while attempts < max_retries:
            try:
                if self.current_model is None:
                    if not self._try_next_model():
                        raise Exception("No working models available")
                
                response = await self.current_model.ainvoke(prompt)
                return response.content
                
            except Exception as e:
                error_str = str(e)
                
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
        """
        Initialize ChromaDB with LOCAL embeddings (no Google API needed!)
        Uses sentence-transformers running locally on your server
        """
        if self.vectorstore is None:
            try:
                print("[VECTOR] Initializing with LOCAL embeddings (no API calls)...")
                
                # Use local sentence-transformer model (no API needed!)
                # This runs on your CPU/GPU, 100% reliable
                embeddings = HuggingFaceEmbeddings(
                    model_name="all-MiniLM-L6-v2",  # Fast, small (80MB), good quality
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
                
                print("[VECTOR] ✓ Local embedding model loaded")
                
                # Connect to ChromaDB
                chroma_client = chromadb.HttpClient(
                    host="chromadb",
                    port=8000,
                    settings=Settings(anonymized_telemetry=False)
                )
                
                print("[VECTOR] ✓ Connected to ChromaDB container")
                
                collection_name = "mycalo_app_knowledge"
                
                # Delete old collection if exists (fresh start)
                try:
                    chroma_client.delete_collection(name=collection_name)
                    print(f"[VECTOR] Deleted old collection")
                except:
                    pass
                
                # Create vector store
                self.vectorstore = Chroma(
                    client=chroma_client,
                    collection_name=collection_name,
                    embedding_function=embeddings,
                )
                
                # YOUR APP KNOWLEDGE BASE - Add as much as you want!
                docs = [
                    # Navigation
                    "To change your password: Go to Settings menu, tap Security section, then tap Change Password. Enter your old password first, then enter and confirm your new password.",
                    
                    "To delete your account permanently: Go to Profile tab, scroll down to the Danger Zone section, tap Delete Account button. Warning: This action is permanent and cannot be undone. All your data will be deleted.",
                    
                    "To add food: Tap the large blue Plus (+) button at the bottom center of the home screen. You can then search for food by name, scan a barcode, or use the camera to take a photo.",
                    
                    "To contact support: Open Settings menu from the top-right corner, navigate to Help & Support section, then tap Email Us or Contact Us. You can also find our FAQ there.",
                    
                    "To view nutrition reports and analytics: Tap the Analytics tab from the bottom navigation menu. You'll see weekly and monthly breakdowns of your calories, macros, and nutrition trends.",
                    
                    "To navigate to settings: Tap the hamburger menu icon (three lines) in the top-right corner of the screen, then select Settings from the dropdown menu.",
                    
                    "To update your profile information: Go to Profile tab from bottom navigation, tap the Edit Profile button at the top, make your changes, then tap Save.",
                    
                    # App Policy (add as much as you need!)
                    "MyCalo AI Privacy Policy: We collect your food logs, nutrition data, and account information to provide personalized nutrition tracking. Your data is encrypted and stored securely. We never sell your personal information to third parties.",
                    
                    "Data retention policy: Your food logs are kept indefinitely unless you delete your account. You can export all your data at any time from Settings > Privacy > Export Data. Account deletion is permanent.",
                    
                    "Terms of Service: By using MyCalo AI, you agree to use the app for personal nutrition tracking only. You must be 13 years or older to use the app. Medical advice should come from healthcare professionals, not the app.",
                    
                    "Subscription and payment: MyCalo AI offers a free tier with basic features. Premium features require a paid subscription. Subscriptions auto-renew unless cancelled 24 hours before renewal.",
                    
                    "Cookie policy: MyCalo AI uses cookies for authentication and to remember your preferences. We use analytics cookies to improve the app experience. You can manage cookie preferences in Settings.",
                    
                    "Community guidelines: Be respectful to other users. No spam, harassment, or inappropriate content. Violations may result in account suspension.",
                    
                    # Features
                    "Barcode scanning: Use the camera feature when adding food to scan product barcodes. The app will automatically fetch nutrition information from our database of over 500,000 products.",
                    
                    "Meal planning feature: Go to Planning tab to create meal plans for the week. You can save favorite meals and recipes for quick logging.",
                    
                    "Goal setting: Set daily calorie and macro goals in Settings > Goals. The app will track your progress and send reminders.",
                    
                    "Export data: You can export all your data to CSV or PDF format from Settings > Privacy > Export Data. The file will be emailed to your registered email address.",
                    
                    "Weight tracking: Log your weight by tapping the weight graph on the Dashboard, then tap the + button. You can view trends over time.",
                    
                    "Water tracking: Track water intake from the home screen quick actions. Set daily water goals in Settings > Goals > Water Intake.",
                    
                    # Troubleshooting
                    "If food search is not working: Make sure you have an internet connection. Try clearing the app cache in Settings > Advanced > Clear Cache.",
                    
                    "If barcode scanning fails: Ensure camera permissions are enabled in your phone settings. Make sure there's good lighting and the barcode is in focus.",
                    
                    "Sync issues: If your data isn't syncing, go to Settings > Data > Sync Now. Check that you're logged in and have internet connection.",
                    
                    # Add more as needed - the vector DB can handle thousands of documents!
                ]
                
                # Add documents to ChromaDB
                print(f"[VECTOR] Adding {len(docs)} documents to ChromaDB...")
                self.vectorstore.add_texts(docs)
                
                print(f"[VECTOR] ✓ ChromaDB initialized with {len(docs)} documents")
                return True
                
            except Exception as e:
                print(f"[VECTOR ERROR]: {e}")
                import traceback
                traceback.print_exc()
                return False
        return True

    def _classify_query_fast(self, query: str) -> str:
        """Fast keyword-based classification"""
        query_lower = query.lower()

        # HIGH PRIORITY: App navigation and policy questions
        high_priority_app = [
            "how to change password", "change password", "reset password",
            "navigate to", "find the button", "where is the",
            "how do i", "where can i", "how to use", "how to delete",
            "how to contact", "contact support", "contack support",
            "how to add food", "settings menu", "navigation",
            "privacy policy", "terms of service", "app policy",
            "data retention", "cookie policy", "subscription",
            "barcode scan", "export data", "community guidelines",
        ]
        
        for phrase in high_priority_app:
            if phrase in query_lower:
                print(f"[CLASSIFY] APP (matched: '{phrase}')")
                return "APP"

        # MEDIUM PRIORITY: SQL queries
        sql_indicators = [
            "what did i eat", "what i ate", "what i eat",
            "how much protein", "how much calorie", "total calories",
            "total protein", "my meals", "yesterday",
            "today lunch", "today breakfast", "today dinner",
            "last week", "stomach pain", "how many calories left",
            "calories remaining", "how much left", "calorie goal",
        ]
        
        for phrase in sql_indicators:
            if phrase in query_lower:
                print(f"[CLASSIFY] SQL (matched: '{phrase}')")
                return "SQL"

        # LOW PRIORITY: Single word scoring
        app_words = ["password", "setting", "button", "account", "delete", "support", 
                     "contact", "policy", "privacy", "terms", "subscription", "export"]
        sql_words = ["eat", "ate", "meal", "food", "calorie", "protein", "carb", "goal", "left"]
        
        app_matches = sum(1 for word in app_words if word in query_lower)
        sql_matches = sum(1 for word in sql_words if word in query_lower)
        
        if app_matches > sql_matches:
            print(f"[CLASSIFY] APP (score: {app_matches} vs SQL: {sql_matches})")
            return "APP"
        elif sql_matches > 0:
            print(f"[CLASSIFY] SQL (score: {sql_matches} vs APP: {app_matches})")
            return "SQL"

        print(f"[CLASSIFY] GENERAL (no strong matches)")
        return "GENERAL"

    async def process_query(self, user_query: str, user_id: int) -> str:
        """Main processing"""
        try:
            query_type = self._classify_query_fast(user_query)
            print(f"[ROUTE] {query_type} - Query: {user_query}")

            if query_type == "SQL":
                return await self._handle_sql_intelligent(user_query, user_id)
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

    async def _handle_sql_intelligent(self, query: str, user_id: int) -> str:
        """Intelligent SQL with reasoning"""
        if not self._init_database():
            return "Database temporarily unavailable. Please try again."

        reasoning_prompt = f"""Analyze what database query is needed.

Current: 2026-02-13

User ({user_id}): "{query}"

Determine needed data. Use 2026 for dates!

What query? (1 sentence)"""

        reasoning = await self._call_llm_async(reasoning_prompt)
        print(f"[REASONING] {reasoning}")

        sql_prompt = f"""Generate PostgreSQL query.

DB: tracking_dailylog (user_id, food_item_id, user_serving_grams, meal_type, date)
    foods_fooditem (id, name, calories, protein, carbs, fat per 100g)

Rules:
1. WHERE user_id = {user_id}
2. JOIN on food_item_id
3. Calculate: (user_serving_grams/100.0) * value
4. Dates: '2026-MM-DD'

Need: {reasoning}
Question: {query}

SQL only:"""

        try:
            sql = await self._call_llm_async(sql_prompt)
            sql = sql.replace("```sql", "").replace("```", "").strip().rstrip(';')
            print(f"[SQL]:\n{sql}")

            result = self.db.run(sql)
            print(f"[RESULT]: {result}")

            if not result or result == "[]" or str(result) == "[(None,)]":
                return "I couldn't find food logs for that period. Make sure you've logged meals!"

            interpret = f"""User: "{query}"
Data: {result}

If "left/remaining": Calculate goal - consumed.
Otherwise: Summarize clearly.

2-3 sentences:"""

            response = await self._call_llm_async(interpret)
            return response

        except Exception as e:
            print(f"[SQL ERROR]: {e}")
            return "I had trouble querying your food logs. Please try again."

    async def _handle_app(self, query: str) -> str:
        """Handle app questions with ChromaDB semantic search"""
        print("[APP] Using ChromaDB with local embeddings...")
        
        if not self._init_vectorstore():
            print("[APP] Vector DB failed, using direct LLM")
            prompt = f"You are MyCalo Assistant. Question: {query}\n\nProvide app navigation help (2-3 sentences)."
            response = await self._call_llm_async(prompt)
            return response

        try:
            print("[APP] Searching ChromaDB for relevant documents...")
            
            # Semantic search in vector DB (finds similar meaning, not just keywords!)
            docs = self.vectorstore.similarity_search(query, k=3)
            context = "\n\n".join([d.page_content for d in docs])
            
            print(f"[APP] ✓ Found {len(docs)} relevant documents")

            prompt = f"""You are MyCalo Assistant.

User question: {query}

Relevant information from our knowledge base:
{context}

Provide a clear, helpful answer based on this information. Be specific and concise (2-4 sentences)."""

            response = await self._call_llm_async(prompt)
            return response

        except Exception as e:
            print(f"[APP ERROR]: {e}")
            return await self._handle_general(query)

    async def _handle_general(self, query: str) -> str:
        """Handle general questions"""
        try:
            prompt = f"You are MyCalo Assistant. Answer briefly (2-3 sentences):\n\n{query}"
            response = await self._call_llm_async(prompt)
            return response
        except Exception as e:
            print(f"[GENERAL ERROR]: {e}")
            return "I'm having trouble responding right now. Please try again."