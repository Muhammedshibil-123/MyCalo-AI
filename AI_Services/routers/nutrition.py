from fastapi import APIRouter, HTTPException, status
from schemas.nutrition import FoodCreateRequest, NutritionResponse
from services import GeminiService

router = APIRouter(
    prefix="/nutrition",
    tags=["Nutrition"]
)

gemini_service = GeminiService()

@router.post("/analyze", response_model=NutritionResponse)
async def analyze_food_with_ai(request: FoodCreateRequest):
    """
    Receives a food name from Django, asks Gemini for nutrition info, and returns it.
    """
    if not request.query:
        raise HTTPException(status_code=400, detail="Query string is empty")

    print(f"Analyzing food: {request.query}") # Debug log

    data = await gemini_service.analyze_food(request.query)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail="Failed to generate nutritional data from AI."
        )

    # Ensure the AI returned data matches our schema roughly
    return NutritionResponse(
        food_name=data.get("food_name", request.query),
        calories=data.get("calories", 0),
        protein=data.get("protein", 0.0),
        carbs=data.get("carbs", 0.0),
        fats=data.get("fats", 0.0),
        fiber=data.get("fiber", 0.0),
        description=data.get("description", "AI Generated Description")
    )