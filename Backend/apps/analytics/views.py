from datetime import timedelta

from django.db.models import Count, ExpressionWrapper, F, FloatField, Sum
from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import Profile
from apps.tracking.models import DailyLog


class DashboardAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Retrieve the user's personal dashboard analytics, including a 7-day macronutrient breakdown, a 30-day calorie consistency chart, 7-day meal distribution, and successful daily streak counts.",
        tags=["User Analytics Dashboard"],
        responses={
            200: openapi.Response(
                description="Dashboard analytics retrieved successfully.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "seven_days_macros": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            description="Macronutrient totals over the last 7 days.",
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    "date": openapi.Schema(
                                        type=openapi.TYPE_STRING, example="2026-03-02"
                                    ),
                                    "total_calories": openapi.Schema(
                                        type=openapi.TYPE_NUMBER,
                                        format=openapi.FORMAT_FLOAT,
                                    ),
                                    "total_protein": openapi.Schema(
                                        type=openapi.TYPE_NUMBER,
                                        format=openapi.FORMAT_FLOAT,
                                    ),
                                    "total_carbs": openapi.Schema(
                                        type=openapi.TYPE_NUMBER,
                                        format=openapi.FORMAT_FLOAT,
                                    ),
                                    "total_fat": openapi.Schema(
                                        type=openapi.TYPE_NUMBER,
                                        format=openapi.FORMAT_FLOAT,
                                    ),
                                },
                            ),
                        ),
                        "consistency_chart": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            description="Calories consumed vs. daily goal over the last 30 days.",
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    "date": openapi.Schema(
                                        type=openapi.TYPE_STRING, example="2026-03-02"
                                    ),
                                    "consumed": openapi.Schema(
                                        type=openapi.TYPE_NUMBER,
                                        format=openapi.FORMAT_FLOAT,
                                    ),
                                    "goal": openapi.Schema(
                                        type=openapi.TYPE_NUMBER,
                                        format=openapi.FORMAT_FLOAT,
                                    ),
                                },
                            ),
                        ),
                        "meal_distribution": openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            description="Total calories consumed per meal type over the last 7 days.",
                            properties={
                                "BREAKFAST": openapi.Schema(
                                    type=openapi.TYPE_NUMBER,
                                    format=openapi.FORMAT_FLOAT,
                                ),
                                "LUNCH": openapi.Schema(
                                    type=openapi.TYPE_NUMBER,
                                    format=openapi.FORMAT_FLOAT,
                                ),
                                "DINNER": openapi.Schema(
                                    type=openapi.TYPE_NUMBER,
                                    format=openapi.FORMAT_FLOAT,
                                ),
                                "SNACK": openapi.Schema(
                                    type=openapi.TYPE_NUMBER,
                                    format=openapi.FORMAT_FLOAT,
                                ),
                            },
                        ),
                        "streak_completed_days": openapi.Schema(
                            type=openapi.TYPE_INTEGER,
                            description="Number of days in the last 30 days where at least 3 main meals were logged.",
                        ),
                        "daily_calorie_goal": openapi.Schema(
                            type=openapi.TYPE_NUMBER,
                            format=openapi.FORMAT_FLOAT,
                            description="The user's set daily calorie goal.",
                        ),
                    },
                ),
            ),
            401: "Unauthorized - Invalid or missing token",
        },
    )
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        seven_days_ago = today - timedelta(days=6)
        thirty_days_ago = today - timedelta(days=29)

        monthly_logs = DailyLog.objects.filter(
            user=user, date__gte=thirty_days_ago, date__lte=today
        )
        weekly_logs = monthly_logs.filter(date__gte=seven_days_ago)

        weekly_macros_qs = (
            weekly_logs.values("date")
            .annotate(
                total_calories=Sum(
                    ExpressionWrapper(
                        F("user_serving_grams") / 100.0 * F("food_item__calories"),
                        output_field=FloatField(),
                    )
                ),
                total_protein=Sum(
                    ExpressionWrapper(
                        F("user_serving_grams") / 100.0 * F("food_item__protein"),
                        output_field=FloatField(),
                    )
                ),
                total_carbs=Sum(
                    ExpressionWrapper(
                        F("user_serving_grams") / 100.0 * F("food_item__carbohydrates"),
                        output_field=FloatField(),
                    )
                ),
                total_fat=Sum(
                    ExpressionWrapper(
                        F("user_serving_grams") / 100.0 * F("food_item__fat"),
                        output_field=FloatField(),
                    )
                ),
            )
            .order_by("date")
        )

        weekly_macros_dict = {
            item["date"].strftime("%Y-%m-%d"): item for item in weekly_macros_qs
        }
        seven_days_data = []
        for i in range(6, -1, -1):
            date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            seven_days_data.append(
                weekly_macros_dict.get(
                    date_str,
                    {
                        "date": date_str,
                        "total_calories": 0,
                        "total_protein": 0,
                        "total_carbs": 0,
                        "total_fat": 0,
                    },
                )
            )

        profile = Profile.objects.filter(user=user).first()
        calorie_goal = profile.daily_calorie_goal if profile else 0

        monthly_calories_qs = (
            monthly_logs.values("date")
            .annotate(
                total_calories=Sum(
                    ExpressionWrapper(
                        F("user_serving_grams") / 100.0 * F("food_item__calories"),
                        output_field=FloatField(),
                    )
                )
            )
            .order_by("date")
        )

        monthly_calories_dict = {
            item["date"].strftime("%Y-%m-%d"): round(item["total_calories"], 2)
            for item in monthly_calories_qs
        }
        consistency_data = []
        for i in range(29, -1, -1):
            date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            consistency_data.append(
                {
                    "date": date_str,
                    "consumed": monthly_calories_dict.get(date_str, 0),
                    "goal": calorie_goal,
                }
            )

        meal_distribution_qs = weekly_logs.values("meal_type").annotate(
            total_calories=Sum(
                ExpressionWrapper(
                    F("user_serving_grams") / 100.0 * F("food_item__calories"),
                    output_field=FloatField(),
                )
            )
        )

        meal_distribution = {"BREAKFAST": 0, "LUNCH": 0, "DINNER": 0, "SNACK": 0}
        for item in meal_distribution_qs:
            if item["meal_type"] in meal_distribution:
                meal_distribution[item["meal_type"]] = round(item["total_calories"], 2)

        main_meals = ["BREAKFAST", "LUNCH", "DINNER"]
        daily_meal_counts = (
            monthly_logs.filter(meal_type__in=main_meals)
            .values("date")
            .annotate(unique_meals_logged=Count("meal_type", distinct=True))
        )

        successful_streak_days = sum(
            1 for day in daily_meal_counts if day["unique_meals_logged"] == 3
        )

        return Response(
            {
                "seven_days_macros": seven_days_data,
                "consistency_chart": consistency_data,
                "meal_distribution": meal_distribution,
                "streak_completed_days": successful_streak_days,
                "daily_calorie_goal": calorie_goal,
            }
        )
