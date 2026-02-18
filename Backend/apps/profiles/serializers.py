from rest_framework import serializers
from .models import Profile

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'age', 
            'gender', 
            'height', 
            'weight', 
            'target_weight',     
            'medical_conditions', 
            'activity_level', 
            'goal',
            'daily_calorie_goal',
            'protein_goal',
            'carbs_goal',
            'fats_goal'
        ]
        read_only_fields = ['daily_calorie_goal', 'protein_goal', 'carbs_goal', 'fats_goal']