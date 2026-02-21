from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken


class AccountStatusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            try:
                jwt_auth = JWTAuthentication()
                auth_result = jwt_auth.authenticate(request)

                if auth_result:
                    user, token = auth_result

                    if not user.is_active or user.status == "inactive":
                        return JsonResponse(
                            {
                                "error": "Account Blocked",
                                "detail": "Your account has been suspended by an administrator.",
                                "code": "account_blocked",
                            },
                            status=403,
                        )

            except (InvalidToken, AuthenticationFailed) as e:

                error_str = str(e).lower()
                if "inactive" in error_str or "user is deleted" in error_str:
                    return JsonResponse(
                        {
                            "error": "Account Blocked",
                            "detail": "Your account has been suspended by an administrator.",
                            "code": "account_blocked",
                        },
                        status=403,
                    )

        return self.get_response(request)
