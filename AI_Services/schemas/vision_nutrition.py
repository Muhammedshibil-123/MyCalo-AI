from pydantic import BaseModel, Field
from typing import List

# Reusing the structure to match your exact JSON requirement
class NutritionValues(BaseModel):
    calories: float
    protein: float
    carbs: float
    fats: float
    fiber: float
    sugar: float
    saturated_fat: float
    sodium: float
    cholesterol: float

class NutritionItem(BaseModel):
    food_name: str
    user_serving_size_g: int
    nutrition_data_100g: NutritionValues = Field(..., alias="100g_serving_size")

class VisionNutritionResponse(BaseModel):
    overall_suggestion: str
    items: List[NutritionItem]