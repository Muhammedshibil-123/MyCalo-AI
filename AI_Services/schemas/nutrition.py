from pydantic import BaseModel, Field

class FoodCreateRequest(BaseModel):
    query: str = Field(..., example="Pani Puri", description="The name of the food to analyze")

class NutritionResponse(BaseModel):
    food_name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    fiber: float
    sugar: float
    saturated_fat: float
    sodium: float
    cholesterol: float
    