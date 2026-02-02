from django.db import models
from django.conf import settings 

class FoodItem(models.Model):
    # Basic Info
    name = models.CharField(max_length=255, db_index=True) 
    serving_size = models.CharField(max_length=100, help_text="e.g., 1 cup, 100g")
    brand = models.CharField(max_length=255, blank=True, null=True)
    
    # Verification System
    is_verified = models.BooleanField(default=False) 
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_public = models.BooleanField(default=True) 

    # Energy & Macros
    calories = models.PositiveIntegerField(help_text="Energy in kcal")
    protein = models.DecimalField(max_digits=6, decimal_places=2, help_text="Protein in grams")
    carbohydrates = models.DecimalField(max_digits=6, decimal_places=2, help_text="Carbs in grams")
    fat = models.DecimalField(max_digits=6, decimal_places=2, help_text="Fat in grams")
    fiber = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, help_text="Fiber in grams")

    # Key Health Signals
    sugar = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, help_text="Sugar in grams")
    saturated_fat = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, help_text="Saturated fat in grams")
    sodium = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Sodium in mg")
    cholesterol = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Cholesterol in mg")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.calories} kcal)"