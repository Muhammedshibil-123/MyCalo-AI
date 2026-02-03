from google import genai
from config import settings
import json
import asyncio
import re


class GeminiServiceError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class GeminiService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _extract_json(self, text: str) -> dict:
        """
        Extracts JSON object from Gemini text response safely.
        """
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON found in Gemini response")

        return json.loads(match.group())

    async def analyze_food(self, food_query: str) -> dict:
        prompt = f"""
You are a professional nutritionist.

Analyze the food item: "{food_query}"

Return ONLY a valid JSON object.
No markdown. No explanation. No extra text.

Required JSON keys:
- food_name (string)
- calories (integer)
- protein (float)
- carbs (float)
- fats (float)
- fiber (float)
- sugar (float)
- saturated_fat (float)
- sodium (float)
- cholesterol (float)
"""

        for attempt in range(2):  # retry once
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model="gemini-2.5-flash",
                    contents=prompt,
                )

                text = response.text or ""
                print("[GEMINI RAW RESPONSE]")
                print(text)

                if not text.strip():
                    raise ValueError("Empty Gemini response")

                data = self._extract_json(text)

                required_keys = [
                    "food_name",
                    "calories",
                    "protein",
                    "carbs",
                    "fats",
                    "fiber",
                    "sugar",
                    "saturated_fat",
                    "sodium",
                    "cholesterol",
                ]

                for key in required_keys:
                    if key not in data:
                        raise ValueError(f"Missing key: {key}")

                return data

            except (json.JSONDecodeError, ValueError) as e:
                print(f"[GEMINI PARSE ERROR] Attempt {attempt + 1}: {e}")
                if attempt == 1:
                    raise GeminiServiceError(
                        "AI returned invalid or non-JSON response",
                        status_code=502
                    )

            except Exception as e:
                print(f"[GEMINI ERROR] {e}")
                raise GeminiServiceError(
                    "Gemini service failed",
                    status_code=502
                )
