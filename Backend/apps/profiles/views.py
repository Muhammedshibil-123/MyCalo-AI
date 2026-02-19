from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import ProfileUpdateSerializer
from .models import Profile
from rest_framework.permissions import IsAuthenticated  
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser       

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser,JSONParser]  

    def patch(self, request, *args, **kwargs):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)  
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileUpdateSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
