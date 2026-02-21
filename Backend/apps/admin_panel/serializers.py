from rest_framework import serializers
from apps.foods.models import FoodItem, FoodImage

class FoodImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodImage
        fields = ['id', 'image']

class AdminFoodItemSerializer(serializers.ModelSerializer):
    images = FoodImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = FoodItem
        fields = '__all__'