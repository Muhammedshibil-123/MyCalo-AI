from typing import List, Optional

from pydantic import BaseModel, Field


class FoodCreateRequest(BaseModel):
    query: str = Field(
        ..., example="Pani Puri", description="The name of the food to analyze"
    )


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


class NutritionResponse(BaseModel):
    overall_suggestion: str
    items: List[NutritionItem]
