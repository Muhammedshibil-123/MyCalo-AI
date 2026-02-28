import jwt
from django.conf import settings
from channels.middleware import BaseMiddleware
from django.db import close_old_connections

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        headers = dict(scope.get("headers", []))
        token = None
        
        # 1. Try standard Authorization Header
        auth_header = headers.get(b"authorization", b"").decode("utf-8")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
        # 2. Try ASGI Standard Subprotocols (Daphne puts it here!)
        if not token:
            subprotocols = scope.get("subprotocols", [])
            if subprotocols:
                token = subprotocols[0]

        # 3. Fallback to raw Headers
        if not token:
            protocol_header = headers.get(b"sec-websocket-protocol", b"").decode("utf-8")
            if protocol_header:
                token = protocol_header.split(',')[0].strip()

        scope["user_id"] = None
        
        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                scope["user_id"] = payload.get("user_id")
                scope["user_role"] = payload.get("role")
            except (jwt.ExpiredSignatureError, jwt.DecodeError) as e:
                print(f"WS Auth Failed: {e}") # Helps you debug in AWS logs!

        return await super().__call__(scope, receive, send)