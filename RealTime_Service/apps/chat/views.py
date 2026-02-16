import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from .authentication import StatelessTokenAuthentication
from .services import get_dynamodb_resource
from datetime import datetime
import os
from django.conf import settings
from .tasks import process_file_upload

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
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        try:
            doctor_id = int(request.user.id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid user ID format"}, status=400)

        status_filter = request.query_params.get('status', 'active')  
        
        try:
            dynamodb = get_dynamodb_resource()
            consultations_table = dynamodb.Table('DoctorConsultations')

            
            response = consultations_table.query(
                IndexName='DoctorStatusIndex',
                KeyConditionExpression='DoctorID = :doc_id AND #status = :status',
                ExpressionAttributeNames={
                    '#status': 'Status'
                },
                ExpressionAttributeValues={
                    ':doc_id': doctor_id, 
                    ':status': status_filter
                }
            )
            
            consultations = response.get('Items', [])
            
            
            consultations.sort(
                key=lambda x: x.get('LastMessageTime', ''), 
                reverse=True
            )
            
            
            for consult in consultations:
                consult['patient_data'] = {
                    'id': int(consult['PatientID']),
                    'username': f"User {consult['PatientID']}",
                    'first_name': f"Patient {consult['PatientID']}"
                }
            
            return Response(consultations)
            
        except Exception as e:
            print(f"Error fetching consultations: {e}")
            return Response({"error": str(e)}, status=500)


class ResolveConsultationView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        doctor_id = request.user.id
        
        try:
            dynamodb = get_dynamodb_resource()
            consultations_table = dynamodb.Table('DoctorConsultations')
            
            
            response = consultations_table.get_item(
                Key={'ConsultationID': room_id}
            )
            
            consultation = response.get('Item')
            
            if not consultation:
                return Response({"error": "Consultation not found"}, status=404)
            
            if int(consultation['DoctorID']) != doctor_id:
                return Response({"error": "Unauthorized"}, status=403)
            
            
            consultations_table.update_item(
                Key={'ConsultationID': room_id},
                UpdateExpression='SET #status = :status, ResolvedAt = :resolved_at',
                ExpressionAttributeNames={
                    '#status': 'Status'
                },
                ExpressionAttributeValues={
                    ':status': 'resolved',
                    ':resolved_at': datetime.now().isoformat()
                }
            )
            
            return Response({"message": "Consultation resolved successfully"})
            
        except Exception as e:
            print(f"Error resolving consultation: {e}")
            return Response({"error": str(e)}, status=500)
        
class ChatMediaUploadView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.data.get('file')
        room_id = request.data.get('room_id') 
        
        if not file_obj or not room_id:
            return Response({"error": "File and room_id required"}, status=400)

        
        
        tmp_dir = os.path.join(settings.BASE_DIR, 'tmp')
        os.makedirs(tmp_dir, exist_ok=True)
        
        file_path = os.path.join(tmp_dir, file_obj.name)
        
        
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        
        process_file_upload.delay(
            file_path=file_path,
            room_name=room_id,
            user_id=request.user.id,
            original_filename=file_obj.name
        )

        
        return Response({
            "message": "Upload started in background",
            "status": "processing"
        }, status=202)
