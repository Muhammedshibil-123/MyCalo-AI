import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

class StatelessTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None  

        token = auth_header.split(' ')[1]

        try:

            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")

            if not user_id:
                raise AuthenticationFailed('Token invalid: No user ID')

            class SimpleUser:
                is_authenticated = True
                id = user_id
                def __str__(self):
                    return f"User {self.id}"

            return (SimpleUser(), None)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.DecodeError:
            raise AuthenticationFailed('Error decoding token')