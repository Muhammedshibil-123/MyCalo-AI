import random
import secrets
import string


import pyotp
import requests
from django.conf import settings
from django.core.mail import send_mail
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from .aws_utils import send_to_email_queue
from rest_framework import generics, permissions, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import CustomUser
from .serializers import (
    CorporateRegisterSerializer,
    CorporateVerifyOTPSerializer,
    CustomTokenJwtSerializer,
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)


# Create your views here.
class CustomTokenjwtView(TokenObtainPairView):
    serializer_class = CustomTokenJwtSerializer

    @swagger_auto_schema(
        operation_description="Obtain Access and Refresh tokens. Checks if OTP is required for specific roles.",
        tags=["Login"],
        responses={
            200: openapi.Response(
                "Tokens or OTP requirement message", CustomTokenJwtSerializer
            ),
            401: "Invalid credentials",
        },
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            if response.data.get("requires_otp"):
                return response

            refresh_token = response.data.get("refresh")

            response.set_cookie(
                key=settings.SIMPLE_JWT["AUTH_COOKIE"],
                value=refresh_token,
                expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            )

            del response.data["refresh"]

        return response


class CustomTokenRefreshView(TokenRefreshView):
    @swagger_auto_schema(
        operation_description="Refresh Access Token using HttpOnly cookie.",
        tags=["Login"],
        responses={
            200: "Access token refreshed",
            401: "Invalid or expired refresh token",
        },
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])

        if refresh_token:
            request.data["refresh"] = refresh_token

        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:

                if "refresh" in response.data:
                    new_refresh_token = response.data["refresh"]

                    response.set_cookie(
                        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
                        value=new_refresh_token,
                        expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                    )

                access_token_str = response.data.get("access")

                access_token = AccessToken(access_token_str)
                user_id = access_token["user_id"]

                user = CustomUser.objects.get(id=user_id)

                user_serializer = UserSerializer(user)

                response.data["user"] = user_serializer.data

            return response
        except (InvalidToken, TokenError, CustomUser.DoesNotExist):
            response = Response(
                {"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
            return response


class RegisterView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @swagger_auto_schema(
        operation_description="Register a new user. Sends an OTP to the email.",
        tags=["User Register"],
        request_body=RegisterSerializer,
        responses={
            201: RegisterSerializer,
            200: "User exists but unverified (OTP resent)",
            409: "User with this email already exists",
            400: "Bad Request (Validation errors)",
        },
    )
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        existing_user = CustomUser.objects.filter(email=email).first()

        if existing_user:
            if not existing_user.is_active:
                otp_code = str(random.randint(100000, 999999))
                existing_user.otp = otp_code
                existing_user.save()

                send_mail(
                    "Mycalo AI Verification Code",
                    f"Your Mycalo AI verification code is {otp_code}. "
                    "Please do not share this code with anyone.",
                    settings.EMAIL_HOST_USER,
                    [existing_user.email],
                    fail_silently=False,
                )
                return Response(
                    {"message": "User exists but unverified. New OTP sent."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "User with this email already exists."},
                    status=status.HTTP_409_CONFLICT,
                )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            otp_code = str(random.randint(100000, 999999))
            user.otp = otp_code
            user.save()

            send_mail(
                "Mycalo AI Verification Code",
                f"Your Mycalo AI verification code is {otp_code}. "
                "Please do not share this code with anyone.",
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(views.APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Verify User OTP and log them in.",
        tags=["User Register"],
        request_body=VerifyOTPSerializer,
        responses={
            200: "Account verified successfully (returns tokens)",
            400: "Invalid OTP or Bad Request",
            404: "User not found",
        },
    )
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]

            try:
                user = CustomUser.objects.get(email=email)
                if user.otp == otp:
                    user.is_active = True
                    user.otp = None
                    user.save()

                    refresh = RefreshToken.for_user(user)

                    response = Response(
                        {
                            "message": "Account verified successfully!",
                            "access": str(refresh.access_token),
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "role": user.role,
                            "mobile": user.mobile,
                        },
                        status=status.HTTP_200_OK,
                    )

                    response.set_cookie(
                        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
                        value=str(refresh),
                        expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                    )

                    return response
                else:
                    return Response(
                        {"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST
                    )

            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Login or Register with Google Access Token.",
        tags=["Login"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "token": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Google Access Token"
                ),
            },
            required=["token"],
        ),
        responses={
            200: "Login successful (returns tokens)",
            400: "Invalid Google Token",
            403: "Account blocked",
        },
    )
    def post(self, request):
        google_token = request.data.get("token")
        if not google_token:
            return Response(
                {"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        user_info_req = requests.get(
            f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={google_token}"
        )

        if not user_info_req.ok:
            return Response(
                {"error": "Invalid Google Token"}, status=status.HTTP_400_BAD_REQUEST
            )

        idinfo = user_info_req.json()
        email = idinfo["email"]
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")

        try:
            user = CustomUser.objects.get(email=email)

            if user.role in ["admin", "doctor", "employee"]:
                return Response(
                    {"requires_otp": True, "email": user.email, "role": user.role},
                    status=status.HTTP_200_OK,
                )

            if user.status != "active":
                return Response(
                    {"error": "Your account is blocked or inactive."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        except CustomUser.DoesNotExist:
            random_suffix = "".join(
                secrets.choice(string.ascii_lowercase + string.digits) for _ in range(4)
            )
            username = f"{email.split('@')[0]}_{random_suffix}"

            user = CustomUser.objects.create(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                role="user",
                is_active=True,
                status="active",
            )
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["username"] = user.username

        daily_calorie_goal = 0
        try:
            if hasattr(user, 'profile'):
                daily_calorie_goal = user.profile.daily_calorie_goal
        except Exception:
            pass

        response = Response(
            {
                "access": str(refresh.access_token),
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "mobile": user.mobile,
                "daily_calorie_goal": daily_calorie_goal,
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE"],
            value=str(refresh),
            expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        )

        return response


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class DoctorListView(ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomUser.objects.filter(role='doctor')

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Retrieve a user by ID.",
        tags=["User"],
        responses={200: UserSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Update a user by ID.",
        tags=["User"],
        request_body=UserSerializer,
        responses={200: UserSerializer},
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Partially update a user by ID.",
        tags=["User"],
        request_body=UserSerializer,
        responses={200: UserSerializer},
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Delete a user by ID.",
        tags=["User"],
        responses={204: "No Content"},
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == "inactive":
            instance.is_active = False
        elif instance.status == "active":
            instance.is_active = True
        instance.save()


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Request password reset OTP via email.",
        tags=["Forget Password"],
        request_body=ForgotPasswordSerializer,
        responses={
            200: "OTP sent to your email",
            404: "User with this email does not exist",
            400: "Bad Request",
        },
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = CustomUser.objects.get(email=email)

                otp_code = str(random.randint(100000, 999999))
                user.otp = otp_code
                user.save()

                send_to_email_queue(
                    "Reset Your Password - Mycalo AI",
                    f"Your Password Reset OTP is: {otp_code}",
                    email
                )

                return Response(
                    {"message": "OTP sent to your email."}, status=status.HTTP_200_OK
                )

            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Reset password using OTP.",
        tags=["Forget Password"],
        request_body=ResetPasswordSerializer,
        responses={
            200: "Password reset successfully",
            400: "Invalid or expired OTP",
            404: "User not found",
        },
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]
            password = serializer.validated_data["new_password"]

            try:
                user = CustomUser.objects.get(email=email)

                if user.otp == otp and user.otp is not None:
                    user.set_password(password)
                    user.otp = None
                    user.save()
                    return Response(
                        {"message": "Password reset successfully."},
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"error": "Invalid or expired OTP."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CorporateRegisterView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = CorporateRegisterSerializer

    @swagger_auto_schema(
        operation_description="Register for Corporate/Doctor roles with Employee ID.",
        tags=["Corporate Register"],
        request_body=CorporateRegisterSerializer,
        responses={
            201: "Account created. Set up Google Authenticator.",
            200: "User verified. Set up Google Authenticator.",
            400: "Invalid credentials or Employee ID mismatch",
        },
    )
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        password = request.data.get("password")
        employee_id = request.data.get("employee_id")

        existing_user = CustomUser.objects.filter(email=email).first()

        if existing_user:
            if not existing_user.check_password(password):
                return Response(
                    {"error": "Invalid credentials."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            role_map = {
                "doc1234": "doctor",
                "employee1234": "employee",
                "admin1234": "admin",
            }

            expected_role = role_map.get(employee_id)
            if not expected_role:
                return Response(
                    {"employee_id": "Invalid Employee ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if existing_user.role != expected_role:
                return Response(
                    {"error": "Employee ID does not match registered role."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not existing_user.totp_secret:
                existing_user.totp_secret = pyotp.random_base32()
                existing_user.save()

            totp = pyotp.TOTP(existing_user.totp_secret)
            provisioning_uri = totp.provisioning_uri(
                name=existing_user.email, issuer_name="MyCalo AI"
            )

            return Response(
                {
                    "message": "User verified. Set up Google Authenticator.",
                    "email": existing_user.email,
                    "role": existing_user.role,
                    "secret": existing_user.totp_secret,
                    "otpauth_url": provisioning_uri,
                },
                status=status.HTTP_200_OK,
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            totp_secret = pyotp.random_base32()
            user.totp_secret = totp_secret
            user.save()

            totp = pyotp.TOTP(totp_secret)
            provisioning_uri = totp.provisioning_uri(
                name=user.email, issuer_name="MyCalo AI"
            )

            return Response(
                {
                    "message": "Account created. Set up Google Authenticator.",
                    "email": user.email,
                    "role": user.role,
                    "secret": totp_secret,
                    "otpauth_url": provisioning_uri,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CorporateVerifyOTPView(views.APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Verify Google Authenticator OTP for Corporate users.",
        tags=["Corporate Register"],
        request_body=CorporateVerifyOTPSerializer,
        responses={
            200: "Account verified successfully (returns tokens)",
            400: "Invalid Authenticator Code or TOTP not setup",
            404: "User not found",
        },
    )
    def post(self, request):
        serializer = CorporateVerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]

            try:
                user = CustomUser.objects.get(email=email)

                if not user.totp_secret:
                    return Response(
                        {"error": "TOTP not set up for this user."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                totp = pyotp.TOTP(user.totp_secret)
                if totp.verify(otp):
                    user.is_active = True
                    user.save()

                    refresh = RefreshToken.for_user(user)

                    response = Response(
                        {
                            "message": "Account verified successfully!",
                            "access": str(refresh.access_token),
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "role": user.role,
                            "mobile": user.mobile,
                        },
                        status=status.HTTP_200_OK,
                    )

                    response.set_cookie(
                        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
                        value=str(refresh),
                        expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                    )

                    return response
                else:
                    return Response(
                        {"error": "Invalid Authenticator Code"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Logout user and clear auth cookie.",
        tags=["Login"],
        responses={200: "Logout successful", 400: "Logout failed"},
    )
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])

            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            response = Response(
                {"message": "Logout successful"}, status=status.HTTP_200_OK
            )

            response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
            return response
        except Exception as e:
            return Response(
                {"error": "Logout failed"}, status=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Change authenticated user's password.",
        tags=["User"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "old_password": openapi.Schema(type=openapi.TYPE_STRING),
                "new_password": openapi.Schema(type=openapi.TYPE_STRING),
            },
            required=["old_password", "new_password"],
        ),
        responses={
            200: "Password updated successfully",
            400: "Incorrect old password or weak new password",
        },
    )
    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        user = request.user

        if not new_password or len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Incorrect old password."}, status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {"message": "Password updated successfully."}, status=status.HTTP_200_OK
        )
