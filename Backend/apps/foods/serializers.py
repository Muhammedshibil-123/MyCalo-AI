from rest_framework import serializers

from .models import FoodItem,FoodImage,FoodVote


class FoodImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodImage
        fields = ["id", "image"]


class FoodItemSerializer(serializers.ModelSerializer):
    images = FoodImageSerializer(many=True, read_only=True)  

    class Meta:
        model = FoodItem
        fields = "__all__"
        read_only_fields = ["is_verified", "created_by"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        return super().create(validated_data)
    
class VoteSerializer(serializers.Serializer):
    vote_type = serializers.ChoiceField(choices=['upvote', 'downvote'])


class AdminFoodItemSerializer(serializers.ModelSerializer):
    images = FoodImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = FoodItem
        fields = '__all__'