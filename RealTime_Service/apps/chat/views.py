import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from .authentication import StatelessTokenAuthentication  
from django.conf import settings


class ChatMediaUploadView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        upload_data = cloudinary.uploader.upload(file_obj, resource_type="auto", folder="chat_media")

        return Response({
            "url": upload_data.get("secure_url"),
            "format": upload_data.get("format"),
            "resource_type": upload_data.get("resource_type")
        })
    
