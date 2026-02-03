import google.generativeai as genai
from config import settings
import json

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def analyze_food(self, food_query: str):
        prompt = f"""
        Act as a professional nutritionist. Analyze the food item: "{food_query}".
        Provide a standard nutritional breakdown for one serving.
        
        You MUST return the result in strictly valid JSON format with no Markdown formatting or code blocks.
        The JSON keys must exactly match: "food_name", "calories" (integer), "protein" (float), "carbs" (float), "fats" (float), "fiber" (float), and "description" (short summary string).
        
        Example JSON:
        {{
            "food_name": "Chicken Biryani",
            "calories": 350,
            "protein": 25.0,
            "carbs": 45.0,
            "fats": 12.0,
            "fiber": 2.5,
            "description": "A savory chicken and rice dish seasoned with spices."
        }}
        """

        try:
            response = self.model.generate_content(prompt)
            # Clean the response text to ensure it's pure JSON
            result_text = response.text.replace('```json', '').replace('```', '').strip()
            data = json.loads(result_text)
            return data
        except Exception as e:
            print(f"Error generating content: {e}")
            return None 