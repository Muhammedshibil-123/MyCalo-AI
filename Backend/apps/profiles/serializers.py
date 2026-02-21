from rest_framework import serializers

from .models import Profile, WeightHistory


class ProfileUpdateSerializer(serializers.ModelSerializer):

    photo = serializers.ImageField(required=False, allow_null=True)
    photo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            "name",
            "photo",
            "photo_url",
            "age",
            "gender",
            "height",
            "weight",
            "target_weight",
            "medical_conditions",
            "activity_level",
            "goal",
            "daily_calorie_goal",
            "protein_goal",
            "carbs_goal",
            "fats_goal",
            "fcm_token",
        ]
        read_only_fields = [
            "daily_calorie_goal",
            "protein_goal",
            "carbs_goal",
            "fats_goal",
        ]

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        try:
            return obj.photo.url
        except Exception:
            return str(obj.photo)


class WeightHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightHistory
        fields = ["id", "weight", "date"]
