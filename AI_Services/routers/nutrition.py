from fastapi import APIRouter, HTTPException, status
from schemas.nutrition import FoodCreateRequest, NutritionResponse
from services.gemini import GeminiService, GeminiServiceError

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

gemini_service = GeminiService()


@router.post("/analyze", response_model=NutritionResponse)
async def analyze_food_with_ai(request: FoodCreateRequest):
    """
    Receives a food name, asks Gemini for nutrition info, and returns it.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query string is empty"
        )

    print(f"[AI REQUEST] Food: {request.query}")

    try:
        data = await gemini_service.analyze_food(request.query)

    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return NutritionResponse(
        food_name=data.get("food_name", request.query),
        portion_description=data.get("portion_description"),
        calories=data.get("calories", [0, 0]),
        protein=data.get("protein", [0, 0]),
        carbs=data.get("carbs", [0, 0]),
        fats=data.get("fats", [0, 0]),
        fiber=data.get("fiber", [0, 0]),
        sugar=data.get("sugar", [0, 0]),
        saturated_fat=data.get("saturated_fat", [0, 0]),
        sodium=data.get("sodium", [0, 0]),
        cholesterol=data.get("cholesterol", [0, 0]),
    )
