from fastapi import APIRouter, HTTPException, status, UploadFile, File
from schemas.vision_nutrition import VisionNutritionResponse
from services.gemini_vision import GeminiVisionService, GeminiVisionServiceError

router = APIRouter(prefix="/nutrition", tags=["Nutrition Vision"])

gemini_vision_service = GeminiVisionService()

@router.post("/analyze-image", response_model=VisionNutritionResponse)
async def analyze_food_image_with_ai(file: UploadFile = File(...)):
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/heic"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Supported: JPEG, PNG, WEBP, HEIC"
        )

    print(f"[VISION REQUEST] Received file: {file.filename}")

    try:
        # Read file bytes
        image_bytes = await file.read()
        
        data = await gemini_vision_service.analyze_food_image(image_bytes, file.content_type)
        
        if not data or "items" not in data:
             return {"overall_suggestion": "Could not analyze image.", "items": []}

        return data

    except GeminiVisionServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        print(f"[INTERNAL ERROR] {e}")
        return {"overall_suggestion": "Service currently unavailable.", "items": []}