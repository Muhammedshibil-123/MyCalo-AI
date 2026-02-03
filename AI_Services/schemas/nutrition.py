from pydantic import BaseModel, Field
from typing import List

class FoodCreateRequest(BaseModel):
    query: str = Field(..., example="Pani Puri", description="The name of the food to analyze")

class NutritionResponse(BaseModel):
    food_name: str
    portion_description: str | None = None
    calories: List[float]
    protein: List[float]
    carbs: List[float]
    fats: List[float]
    fiber: List[float]
    sugar: List[float]
    saturated_fat: List[float]
    sodium: List[float]
    cholesterol: List[float]
    