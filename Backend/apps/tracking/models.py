from django.db import models
from django.conf import settings
from apps.foods.models import FoodItem

class DailyLog(models.Model):
    MEAL_TYPES = (
        ('BREAKFAST', 'Breakfast'),
        ('LUNCH', 'Lunch'),
        ('DINNER', 'Dinner'),
        ('SNACK', 'Snack'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_logs')
    food_item = models.ForeignKey(FoodItem, on_delete=models.PROTECT)
    
    quantity = models.FloatField(default=1.0, help_text="Number of servings consumed")
    
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.food_item.name}"