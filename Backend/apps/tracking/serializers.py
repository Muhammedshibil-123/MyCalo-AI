from rest_framework import serializers
from .models import DailyLog

class DailyLogSerializer(serializers.ModelSerializer):
    food_details = serializers.SerializerMethodField()

    class Meta:
        model = DailyLog
        fields = [
            'id', 
            'food_item',         
            'user_serving_grams', 
            'meal_type',          
            'date',               
            'food_details'        
        ]

        extra_kwargs = {
            'food_item': {'write_only': True}, 
            'meal_type': {'write_only': True}, 
            'date': {'write_only': True},
        }

    def get_food_details(self, obj):
        food = obj.food_item
        grams = obj.user_serving_grams
        
        if grams <= 0:
            ratio = 0
        else:
            ratio = grams / 100.0

        return {
            "name": food.name,
            "brand": food.brand,
            "calories": round(food.calories * ratio),
            "protein": round(float(food.protein) * ratio, 1),
            "carbohydrates": round(float(food.carbohydrates) * ratio, 1),
            "fat": round(float(food.fat) * ratio, 1),
            "fiber": round(float(food.fiber) * ratio, 1),
            "sugar": round(float(food.sugar) * ratio, 1),
            "sodium": round(float(food.sodium) * ratio, 1),
            "cholesterol": round(float(food.cholesterol) * ratio, 1),
        }