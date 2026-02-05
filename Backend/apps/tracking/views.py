from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import DailyLog
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
