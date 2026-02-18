from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser


class CustomTokenJwtSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if self.user.role in ["admin", "doctor", "employee"]:
            return {
                "requires_otp": True,
                "email": self.user.email,
                "role": self.user.role,
                "message": "OTP Verification Required",
            }
        
        daily_calorie_goal = 0
        try:
            if hasattr(self.user, 'profile'):
                daily_calorie_goal = self.user.profile.daily_calorie_goal
        except Exception:
            pass

        data.update(
            {
                "id": self.user.id,
                "username": self.user.username,
                "email": self.user.email,
                "role": self.user.role,
                "mobile": self.user.mobile,
                "daily_calorie_goal": daily_calorie_goal,
            }
        )

        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ("username", "email", "mobile", "password", "confirm_password")

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.is_active = False
        user.save()

        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "mobile", "status", "role", "is_active"]


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class CorporateRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    employee_id = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = (
            "username",
            "email",
            "mobile",
            "password",
            "confirm_password",
            "employee_id",
        )

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")

        emp_id = data.get("employee_id")
        if emp_id not in ["doc1234", "employee1234", "admin1234"]:
            raise serializers.ValidationError({"employee_id": "Invalid Employee ID."})

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        emp_id = validated_data.pop("employee_id")
        password = validated_data.pop("password")

        role = "user"
        if emp_id == "doc1234":
            role = "doctor"
        elif emp_id == "employee1234":
            role = "employee"
        elif emp_id == "admin1234":
            role = "admin"

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.role = role
        user.is_active = False
        user.save()

        return user


class CorporateVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
