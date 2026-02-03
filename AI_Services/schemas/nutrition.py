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
    description: str
    is_generated: bool = True