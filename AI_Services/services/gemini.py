import json
import requests
import asyncio
from config import settings

class GeminiServiceError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class GeminiService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured")
        
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        
        self.models_chain = [
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
        ]

    async def analyze_food(self, food_query: str) -> dict: 
        prompt = f"""
        You are a professional nutritionist AI.

        USER INPUT: "{food_query}"

        TASK:
        1. Identify all distinct food items in the input.
        2. Estimate the serving size based on the user's text.
        3. Calculate nutrition for TWO standard metrics:
           - Index 0: Per 100 grams
           - Index 1: Per the ACTUAL serving size described by the user.

        OUTPUT FORMAT (Strict JSON, No Markdown):
        {{
          "items": [
            {{
              "food_name": "Specific Food Name",
              "portion_description": "e.g., 1 bowl (200g)",
              "calories": [0, 0],
              "protein": [0, 0],
              "carbs": [0, 0],
              "fats": [0, 0],
              "fiber": [0, 0],
              "sugar": [0, 0],
              "saturated_fat": [0, 0],
              "sodium": [0, 0],
              "cholesterol": [0, 0]
            }}
          ]
        }}
        """

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }

        last_error = None

        for model in self.models_chain:
            print(f"[AI REQUEST] Trying model: {model}...")

            try:
                response = await asyncio.to_thread(
                    requests.post,
                    f"{self.base_url}/{model}:generateContent?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload
                )

                if response.status_code != 200:
                    print(f"[FAIL] {model} failed with {response.status_code}. Error: {response.text}")
                    last_error = f"{model} error: {response.status_code}"
                    continue

                result = response.json()
                
                try:
                    text_data = result["candidates"][0]["content"]["parts"][0]["text"]
                    text_data = text_data.replace("```json", "").replace("```", "").strip()
                    
                    print(f"[SUCCESS] Connected to {model}")
                    return json.loads(text_data)

                except Exception:
                    print(f"[PARSE ERROR] {model} returned bad data: {result}")
                    last_error = f"{model} parsing failed"
                    continue

            except Exception as e:
                print(f"[EXCEPTION] {model} crashed: {e}")
                last_error = str(e)
                continue

        print("[FATAL] All 5 failover models failed.")
        raise GeminiServiceError(
            f"Service Unavailable. All AI models failed. Last error: {last_error}", 
            status_code=503
        )   