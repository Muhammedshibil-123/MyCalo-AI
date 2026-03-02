from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import verify_token
from schemas.nutrition import FoodCreateRequest, NutritionResponse
from services.gemini import GeminiService, GeminiServiceError

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

gemini_service = GeminiService()


@router.post(
    "/analyze", response_model=NutritionResponse, 
    dependencies=[Depends(verify_token)],
    summary="Analyze food from text",
    response_description="Returns a detailed nutritional breakdown and health suggestions for the food.",
    responses={
        200: {"description": "Successfully analyzed the food item."},
        400: {"description": "Bad Request - The query string was empty."},
        401: {"description": "Unauthorized - Missing or invalid authentication token."},
        500: {"description": "Internal Server Error or AI Service Unavailable."},
    }
)
async def analyze_food_with_ai(request: FoodCreateRequest):
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query string is empty"
        )

    print(f"[AI REQUEST] Food: {request.query}")

    try:
        data = await gemini_service.analyze_food(request.query)
        if not data or "items" not in data:
            return {"overall_suggestion": "Could not analyze food.", "items": []}
        return data

    except GeminiServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        print(f"[INTERNAL ERROR] {e}")
        return {"overall_suggestion": "Service currently unavailable.", "items": []}
