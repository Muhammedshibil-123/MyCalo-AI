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

The user input may contain:
- multiple foods
- misspellings
- mixed dishes
- quantities in informal language

YOU MUST FOLLOW THESE STEPS STRICTLY:

STEP 1 — FOOD EXTRACTION (MANDATORY)
From the user input, extract ALL distinct food items.
- Mixed foods MUST be split into individual components.
- Example: "macaroni with mayonnaise and tomato sauce" →
  ["macaroni", "mayonnaise", "tomato sauce"]
- Do NOT keep the original sentence as a food name.

STEP 2 — NUTRITION ESTIMATION (MANDATORY)
For EACH extracted food item, estimate nutrition separately.

FORMAT RULES (VERY IMPORTANT):
- Return ONLY valid JSON.
- NO markdown.
- NO explanations.
- You MUST return an ARRAY under "items".
- Each item MUST represent ONE food only.
- You are NOT allowed to return a single merged food item.
- If you cannot estimate exactly, make a reasonable approximation.
- Use 0 ONLY if a value is truly unknown.

ARRAY RULE:
For each numeric nutrition field, return an array:
[index 0 = per 100 grams, index 1 = actual user serving]

STRICT JSON SCHEMA:

{
  "items": [
    {
      "food_name": string,
      "portion_description": string,
      "calories": [number, number],
      "protein": [number, number],
      "carbs": [number, number],
      "fats": [number, number],
      "fiber": [number, number],
      "sugar": [number, number],
      "saturated_fat": [number, number],
      "sodium": [number, number],
      "cholesterol": [number, number]
    }
  ]
}

"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        }

        last_error = None

        for model in self.models_chain:
            print(f"[AI REQUEST] Trying model: {model}...")

            try:
                response = await asyncio.to_thread(
                    requests.post,
                    f"{self.base_url}/{model}:generateContent?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                )

                if response.status_code != 200:
                    print(
                        f"[FAIL] {model} failed with {response.status_code}. Error: {response.text}"
                    )
                    last_error = f"{model} error: {response.status_code}"
                    continue

                result = response.json()

                try:
                    text_data = result["candidates"][0]["content"]["parts"][0]["text"]
                    text_data = (
                        text_data.replace("```json", "").replace("```", "").strip()
                    )
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
            status_code=503,
        )
