import json
import requests
import asyncio
import base64
from config import settings

class GeminiVisionServiceError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class GeminiVisionService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured")

        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

        self.models_chain = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            
        ]

    async def analyze_food_image(self, image_bytes: bytes, mime_type: str) -> dict:

        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        prompt = """
        You are a professional nutritionist AI.
        
        TASK:
        1. Analyze the provided image and identify all distinct food items visible.
        2. Estimate the serving size in GRAMS (integer) for each item visible on the plate.
        3. Calculate nutrition for 100 GRAMS of the food item.
        4. Provide an 'overall_suggestion': A 4-line summary offering health advice based on this specific meal.

        OUTPUT FORMAT (Strict JSON, No Markdown):
        {
          "overall_suggestion": "Your advice here as Nutritionist’s...",
          "items": [
            {
              "food_name": "Specific Food Name",
              "user_serving_size_g": 250,
              "100g_serving_size": {
                  "calories": 0.0,
                  "protein": 0.0,
                  "carbs": 0.0,
                  "fats": 0.0,
                  "fiber": 0.0,
                  "sugar": 0.0,
                  "saturated_fat": 0.0,
                  "sodium": 0.0,
                  "cholesterol": 0.0
              }
            }
          ]
        }
        
        IMPORTANT:
        - Return ONLY raw JSON. Do not use Markdown code blocks (```json).
        - If the image is unclear or not food, return an empty items list.
        """

      
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_image
                        }
                    }
                ]
            }],
            "generationConfig": {"response_mime_type": "application/json"},
        }

        last_error = None

        for model in self.models_chain:
            print(f"[VISION REQUEST] Trying model: {model}...")

            try:
                response = await asyncio.to_thread(
                    requests.post,
                    f"{self.base_url}/{model}:generateContent?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                )

                if response.status_code != 200:
                    print(f"[FAIL] {model} failed with {response.status_code}. Error: {response.text}")
                    last_error = f"{model} error: {response.status_code}"
                    continue

                result = response.json()

                try:
                    text_data = result["candidates"][0]["content"]["parts"][0]["text"]
                    text_data = text_data.replace("```json", "").replace("```", "").strip()
                    
                    print(f"[SUCCESS] Vision analysis with {model}")
                    return json.loads(text_data)

                except Exception:
                    print(f"[PARSE ERROR] {model} returned bad data")
                    last_error = f"{model} parsing failed"
                    continue

            except Exception as e:
                print(f"[EXCEPTION] {model} crashed: {e}")
                last_error = str(e)
                continue

        print("[FATAL] All vision models failed.")
        raise GeminiVisionServiceError(
            f"Service Unavailable. Vision analysis failed. Last error: {last_error}", 
            status_code=503
        )