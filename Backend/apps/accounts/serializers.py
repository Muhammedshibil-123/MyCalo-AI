from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import CustomUser
from rest_framework.exceptions import AuthenticationFailed

class CustomTokenJwtSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        if self.user.role in ['admin', 'doctor', 'employee']:
            return {
                'requires_otp': True,
                'email': self.user.email,
                'role': self.user.role,
                'message': 'OTP Verification Required'
            }

        data.update({
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'mobile': self.user.mobile
        })

        return data
    
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True) 

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'mobile', 'password', 'confirm_password')

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
       
        password = validated_data.pop('password')
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
        fields = ['id', 'username', 'email', 'mobile', 'status', 'role', 'is_active']



class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6) 
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    

class CorporateRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    employee_id = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'mobile', 'password', 'confirm_password', 'employee_id')

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        
        emp_id = data.get('employee_id')
        if emp_id != "doc1234" and emp_id != "employee1234":
             raise serializers.ValidationError({"employee_id": "Invalid Employee ID."})
            
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        emp_id = validated_data.pop('employee_id')
        password = validated_data.pop('password')
        
        role = 'user'
        if emp_id == "doc1234":
            role = 'doctor'
        elif emp_id == "employee1234":
            role = 'employee'

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.role = role
        user.is_active = False
        user.save()
        
        return user

class CorporateVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    
