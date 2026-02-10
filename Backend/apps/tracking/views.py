from django.utils import timezone
from rest_framework import permissions, status, viewsets,views
from rest_framework.response import Response
from django.db import transaction

from .models import DailyLog
from apps.foods.models import FoodItem
from .serializers import DailyLogSerializer


class DailyLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DailyLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(
            {"message": "Food logged successfully", "success": True},
            status=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        date_str = request.query_params.get("date", str(timezone.now().date()))

        logs = DailyLog.objects.filter(user=request.user, date=date_str).select_related(
            "food_item"
        )

        response_data = {
            "user_id": request.user.id,
            "date": date_str,
            "total_grant_calories": 0,
            "meals": [],
        }

        meal_groups = {
            "BREAKFAST": {
                "meal_type": "breakfast",
                "total_meal_calories": 0,
                "items": [],
            },
            "LUNCH": {"meal_type": "lunch", "total_meal_calories": 0, "items": []},
            "DINNER": {"meal_type": "dinner", "total_meal_calories": 0, "items": []},
            "SNACK": {"meal_type": "snack", "total_meal_calories": 0, "items": []},
        }

        for log in logs:
            serialized_item = DailyLogSerializer(log).data
            if serialized_item.get("food_details"):
                item_calories = serialized_item["food_details"]["calories"]

                meal_key = log.meal_type
                if meal_key in meal_groups:
                    meal_groups[meal_key]["items"].append(serialized_item)
                    meal_groups[meal_key]["total_meal_calories"] += item_calories
                    response_data["total_grant_calories"] += item_calories

        response_data["meals"] = list(meal_groups.values())

        return Response(response_data)
    
class LogAIMealView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Expects the specific AI JSON structure with 'items' containing
        '100g_serving_size' and 'user_serving_size_g'.
        """
        data = request.data
        user = request.user

        meal_type = data.get("meal_type", "SNACK").upper()
        date_str = data.get("date", str(timezone.now().date()))
        
        ai_items = data.get("items", [])

        if not ai_items:
            return Response(
                {"error": "No items provided in the AI response"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                created_logs = []

                for item in ai_items:
                    food_name = item.get("food_name")
                    details_100g = item.get("100g_serving_size", {})
                   
                    food_defaults = {
                        "name": food_name,
                        "serving_size": "100g", 
                        "calories": details_100g.get("calories", 0),
                        "protein": details_100g.get("protein", 0),
                        "carbohydrates": details_100g.get("carbs", 0),
                        "fat": details_100g.get("fats", 0),
                        "fiber": details_100g.get("fiber", 0),
                        "sugar": details_100g.get("sugar", 0),
                        "saturated_fat": details_100g.get("saturated_fat", 0),
                        "sodium": details_100g.get("sodium", 0),
                        "cholesterol": details_100g.get("cholesterol", 0),
                        "source": "AI",
                        "is_public": True,
                        "is_verified": False, 
                        "votes": 0,
                    }

                    food_item, _ = FoodItem.objects.get_or_create(
                        name__iexact=food_name,
                        defaults=food_defaults
                    )

                    user_grams = item.get("user_serving_size_g", 100)
                    
                    log = DailyLog.objects.create(
                        user=user,
                        food_item=food_item,
                        user_serving_grams=user_grams,
                        meal_type=meal_type,
                        date=date_str
                    )
                    created_logs.append(log.id)

            return Response(
                {
                    "message": "AI Meal logged successfully",
                    "logs_created": len(created_logs),
                    "success": True
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e), "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
