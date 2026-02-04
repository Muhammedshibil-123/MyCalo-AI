from fastapi import Header, HTTPException, status
import jwt
from config import settings

async def verify_token(authorization: str = Header(None)):
    """
    Validates the Django JWT Token.
    Format: 'Bearer <token>'
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
            
        # Verify the token using the Shared Secret from Django
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # You can access user_id here if needed: user_id = payload.get("user_id")
        return payload

    except (ValueError, jwt.DecodeError):
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")