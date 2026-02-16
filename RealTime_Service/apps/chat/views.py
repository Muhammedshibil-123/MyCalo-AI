import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from .authentication import StatelessTokenAuthentication  
from django.conf import settings
import boto3
from collections import defaultdict
from datetime import datetime


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
    
class DoctorConsultationListView(APIView):
    """
    Get all unique patient conversations for a doctor with latest message
    """
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctor_id = request.user.id
        
        try:
            dynamodb = boto3.resource(
                'dynamodb',
                region_name='us-east-1',
                endpoint_url='http://localhost:8004',  
                aws_access_key_id='local',
                aws_secret_access_key='local'
            )
            
            table = dynamodb.Table('ChatHistory')

            response = table.scan(
                FilterExpression="contains(RoomID, :doc_pattern)",
                ExpressionAttributeValues={
                    ":doc_pattern": f"_doc_{doctor_id}"
                }
            )
            
            items = response.get('Items', [])
            
            rooms = defaultdict(list)
            for item in items:
                room_id = item['RoomID']
                rooms[room_id].append(item)
        
            consultations = []
            for room_id, messages in rooms.items():
                messages.sort(key=lambda x: x['Timestamp'], reverse=True)
                latest = messages[0]

                parts = room_id.split('_')
                patient_id = int(parts[1])
                
                consultations.append({
                    'room_id': room_id,
                    'patient_id': patient_id,
                    'last_message': latest.get('Message', ''),
                    'last_timestamp': latest['Timestamp'],
                    'sender_id': latest.get('SenderID')
                })
            

            consultations.sort(key=lambda x: x['last_timestamp'], reverse=True)

            for consult in consultations:
                consult['patient_data'] = {
                    'id': consult['patient_id'],
                    'username': f"User {consult['patient_id']}",
                    'first_name': f"Patient {consult['patient_id']}"
                }
            
            return Response(consultations)
            
        except Exception as e:
            print(f"Error fetching consultations: {e}")
            return Response({"error": str(e)}, status=500)







    
