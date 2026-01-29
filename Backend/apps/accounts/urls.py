from django.urls import include, path

from .views import (
    ChangePasswordView,
    CorporateRegisterView,
    CorporateVerifyOTPView,
    CustomTokenjwtView,
    CustomTokenRefreshView,
    ForgotPasswordView,
    GoogleLoginView,
    LogoutView,
    RegisterView,
    ResetPasswordView,
    UserDetailView,
    UserListView,
    VerifyOTPView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("login/", CustomTokenjwtView.as_view(), name="auth_login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path(
        "corporate-register/",
        CorporateRegisterView.as_view(),
        name="corporate_register",
    ),
    path(
        "corporate-verify-otp/",
        CorporateVerifyOTPView.as_view(),
        name="corporate_verify_otp",
    ),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]
