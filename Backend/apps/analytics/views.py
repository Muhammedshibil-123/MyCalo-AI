from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, F, Count, ExpressionWrapper, FloatField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.tracking.models import DailyLog
from apps.profiles.models import Profile

class DashboardAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        seven_days_ago = today - timedelta(days=6)
        thirty_days_ago = today - timedelta(days=29)

        # Base querysets
        monthly_logs = DailyLog.objects.filter(user=user, date__gte=thirty_days_ago, date__lte=today)
        weekly_logs = monthly_logs.filter(date__gte=seven_days_ago)

        # --- 1. Last 7 Days Macros (Bar/Line Chart) ---
        # Note the change here: food_item__carbohydrates instead of food_item__carbs
        weekly_macros_qs = weekly_logs.values('date').annotate(
            total_calories=Sum(ExpressionWrapper(F('user_serving_grams') / 100.0 * F('food_item__calories'), output_field=FloatField())),
            total_protein=Sum(ExpressionWrapper(F('user_serving_grams') / 100.0 * F('food_item__protein'), output_field=FloatField())),
            total_carbs=Sum(ExpressionWrapper(F('user_serving_grams') / 100.0 * F('food_item__carbohydrates'), output_field=FloatField())),
            total_fat=Sum(ExpressionWrapper(F('user_serving_grams') / 100.0 * F('food_item__fat'), output_field=FloatField()))
        ).order_by('date')

        # Fill missing days with 0s for the frontend
        weekly_macros_dict = {item['date'].strftime('%Y-%m-%d'): item for item in weekly_macros_qs}
        seven_days_data = []
        for i in range(6, -1, -1):
            date_str = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            seven_days_data.append(weekly_macros_dict.get(date_str, {
                'date': date_str,
                'total_calories': 0,
                'total_protein': 0,
                'total_carbs': 0,
                'total_fat': 0
            }))

        # --- 2. Consistency Chart (Last 30 Days) ---
        profile = Profile.objects.filter(user=user).first()
        calorie_goal = profile.daily_calorie_goal if profile else 0

        monthly_calories_qs = monthly_logs.values('date').annotate(
            total_calories=Sum(ExpressionWrapper(F('user_serving_grams') / 100.0 * F('food_item__calories'), output_field=FloatField()))
        ).order_by('date')

        monthly_calories_dict = {item['date'].strftime('%Y-%m-%d'): round(item['total_calories'], 2) for item in monthly_calories_qs}
        consistency_data = []
        for i in range(29, -1, -1):
            date_str = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            consistency_data.append({
                'date': date_str,
                'consumed': monthly_calories_dict.get(date_str, 0),
                'goal': calorie_goal
            })

        # --- 3. Meal Distribution (Pie Chart - Last 7 Days) ---
        meal_distribution_qs = weekly_logs.values('meal_type').annotate(
            total_calories=Sum(ExpressionWrapper(F('user_serving_grams') / 100.0 * F('food_item__calories'), output_field=FloatField()))
        )
        
        meal_distribution = {
            'BREAKFAST': 0, 'LUNCH': 0, 'DINNER': 0, 'SNACK': 0
        }
        for item in meal_distribution_qs:
            if item['meal_type'] in meal_distribution:
                meal_distribution[item['meal_type']] = round(item['total_calories'], 2)

        # --- 4. Main Meal Streak (Last 30 Days) ---
        main_meals = ['BREAKFAST', 'LUNCH', 'DINNER']
        daily_meal_counts = monthly_logs.filter(meal_type__in=main_meals).values('date').annotate(
            unique_meals_logged=Count('meal_type', distinct=True)
        )
        
        successful_streak_days = sum(1 for day in daily_meal_counts if day['unique_meals_logged'] == 3)

        return Response({
            'seven_days_macros': seven_days_data,
            'consistency_chart': consistency_data,
            'meal_distribution': meal_distribution,
            'streak_completed_days': successful_streak_days,
            'daily_calorie_goal': calorie_goal
        })