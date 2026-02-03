from pydantic import BaseModel, Field
from typing import List, Optional

class FoodCreateRequest(BaseModel):
    query: str = Field(..., example="Pani Puri", description="The name of the food to analyze")

class NutritionItem(BaseModel):
    food_name: str
    portion_description: Optional[str] = None
    calories: List[float]
    protein: List[float]
    carbs: List[float]
    fats: List[float]
    fiber: List[float]
    sugar: List[float]
    saturated_fat: List[float]
    sodium: List[float]
    cholesterol: List[float]

class NutritionResponse(BaseModel):
    items: List[NutritionItem]