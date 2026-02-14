import jwt
from django.conf import settings
from channels.middleware import BaseMiddleware
from django.db import close_old_connections

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        # Get headers from scope
        headers = dict(scope.get("headers", []))
        token = None
        
        # Look for 'authorization' header (byte string)
        auth_header = headers.get(b"authorization", b"").decode("utf-8")
        
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                scope["user_id"] = payload.get("user_id")
                scope["user_role"] = payload.get("role") 
            except (jwt.ExpiredSignatureError, jwt.DecodeError):
                scope["user_id"] = None
        else:
            scope["user_id"] = None

        return await super().__call__(scope, receive, send)