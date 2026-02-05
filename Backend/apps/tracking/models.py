from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.foods.models import FoodItem


class DailyLog(models.Model):
    MEAL_TYPES = (
        ("BREAKFAST", "Breakfast"),
        ("LUNCH", "Lunch"),
        ("DINNER", "Dinner"),
        ("SNACK", "Snack"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="daily_logs"
    )
    food_item = models.ForeignKey(FoodItem, on_delete=models.PROTECT)
    user_serving_grams = models.FloatField(
        default=100.0, help_text="Amount consumed in grams (e.g., 150.0)"
    )

    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES)
    date = models.DateField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return (
            f"{self.user.username} - {self.food_item.name} - {self.user_serving_grams}g"
        )
