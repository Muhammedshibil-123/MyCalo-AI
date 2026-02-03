from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import FoodItem
from .serializers import FoodItemSerializer
import requests
from rest_framework.views import APIView
from .models import FoodItem
from apps.tracking.models import DailyLog
from .serializers import FoodAnalyzeSerializer
from drf_yasg.utils import swagger_auto_schema  
from drf_yasg import openapi

AI_SERVICE_URL = "http://ai_service:8001/nutrition/analyze"

# Create your views here.
class CreateCustomFoodView(generics.CreateAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_public=False)

class FoodDetailView(generics.RetrieveAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class AIAnalyzeFoodView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        request_body=FoodAnalyzeSerializer,
        responses={
            200: openapi.Response(
                description="Analysis Successful",
                examples={
                    "application/json": {
                        "items": [
                            {
                                "food_name": "Porotta",
                                "calories": [300, 300],
                                "protein": [8, 8],
                                # ...
                            }
                        ]
                    }
                }
            ),
            400: "Query required",
            503: "AI Service Unavailable"
        }
    )

    def post(self, request):
        serializer = FoodAnalyzeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        query = serializer.validated_data.get("query")

        try:
            response = requests.post(AI_SERVICE_URL, json={"query": query}, timeout=10)
            
            if response.status_code == 200:
                return Response(response.json(), status=status.HTTP_200_OK)
            else:
                return Response({"error": "AI Service failed"}, status=response.status_code)
                
        except requests.exceptions.RequestException as e:
            return Response({"error": f"AI Service unreachable: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class LogFoodView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        user = request.user
        
        food_name = data.get("food_name")
        portion_desc = data.get("portion_description")
        calories = data.get("calories")
        protein = data.get("protein")
        carbs = data.get("carbs")
        fats = data.get("fats")
        meal_type = data.get("meal_type", "SNACK")

        if not food_name:
             return Response({"error": "Food name required"}, status=status.HTTP_400_BAD_REQUEST)

        food_item, created = FoodItem.objects.get_or_create(
            name__iexact=food_name,
            calories=calories,
            defaults={
                "name": food_name,
                "serving_size": portion_desc,
                "calories": calories,
                "protein": protein,
                "carbohydrates": carbs,
                "fat": fats,
                "fiber": data.get("fiber", 0),
                "sugar": data.get("sugar", 0),
                "saturated_fat": data.get("saturated_fat", 0),
                "sodium": data.get("sodium", 0),
                "cholesterol": data.get("cholesterol", 0),
                "source": "AI",
                "votes": 0,
                "is_public": True,
                "is_verified": False
            }
        )

        DailyLog.objects.create(
            user=user,
            food_item=food_item,
            quantity=1,
            meal_type=meal_type
        )

        return Response({
            "message": "Food logged successfully",
            "food_id": food_item.id,
            "is_new_public_entry": created
        }, status=status.HTTP_201_CREATED)