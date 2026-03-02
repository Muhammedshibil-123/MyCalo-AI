import os
from datetime import datetime

import cloudinary.uploader
from boto3.dynamodb.conditions import Key
from django.conf import settings
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import StatelessTokenAuthentication
from .services import get_dynamodb_resource
from .tasks import process_file_upload


class ChatMediaUploadView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    @swagger_auto_schema(
        operation_description="Upload media files (images, audio, video) to a specific chat room. The file is processed asynchronously.",
        tags=["Chat Media"],
        manual_parameters=[
            openapi.Parameter(
                name="file",
                in_=openapi.IN_FORM,
                description="The media file to upload",
                type=openapi.TYPE_FILE,
                required=True,
            ),
            openapi.Parameter(
                name="room_id",
                in_=openapi.IN_FORM,
                description="The ID of the chat room",
                type=openapi.TYPE_STRING,
                required=True,
            ),
        ],
        responses={
            202: openapi.Response(description="Upload started in background"),
            400: "File and room_id required",
        },
    )
    def post(self, request):
        file_obj = request.data.get("file")
        room_id = request.data.get("room_id")

        if not file_obj or not room_id:
            return Response({"error": "File and room_id required"}, status=400)

        ext = os.path.splitext(file_obj.name)[1]
        if not ext:
            if "audio" in file_obj.content_type:
                ext = ".webm"
            elif "video" in file_obj.content_type:
                ext = ".mp4"
            else:
                ext = ".jpg"

        safe_name = (
            f"upload_{request.user.id}_{int(os.path.getmtime(settings.BASE_DIR))}{ext}"
        )

        tmp_dir = os.path.join(settings.BASE_DIR, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        file_path = os.path.join(tmp_dir, safe_name)

        with open(file_path, "wb+") as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        process_file_upload.delay(
            file_path=file_path,
            room_name=room_id,
            user_id=request.user.id,
            original_filename=safe_name,
        )

        return Response(
            {"message": "Upload started in background", "status": "processing"},
            status=202,
        )


class DoctorConsultationListView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Fetch a list of consultations for the currently authenticated doctor from DynamoDB.",
        tags=["Doctor Consultations"],
        manual_parameters=[
            openapi.Parameter(
                "status",
                openapi.IN_QUERY,
                description="Filter by consultation status (e.g., 'active', 'resolved')",
                type=openapi.TYPE_STRING,
                default="active",
            )
        ],
        responses={
            200: "List of doctor consultations",
            400: "Invalid user ID format",
            500: "Internal server error connecting to DynamoDB",
        },
    )
    def get(self, request):

        try:
            doctor_id = int(request.user.id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid user ID format"}, status=400)

        status_filter = request.query_params.get("status", "active")

        try:
            dynamodb = get_dynamodb_resource()
            consultations_table = dynamodb.Table("DoctorConsultations")

            response = consultations_table.query(
                IndexName="DoctorStatusIndex",
                KeyConditionExpression="DoctorID = :doc_id AND #status = :status",
                ExpressionAttributeNames={"#status": "Status"},
                ExpressionAttributeValues={
                    ":doc_id": doctor_id,
                    ":status": status_filter,
                },
            )

            consultations = response.get("Items", [])

            consultations.sort(key=lambda x: x.get("LastMessageTime", ""), reverse=True)

            for consult in consultations:
                consult["patient_data"] = {
                    "id": int(consult["PatientID"]),
                    "username": f"User {consult['PatientID']}",
                    "first_name": f"Patient {consult['PatientID']}",
                }

            return Response(consultations)

        except Exception as e:
            print(f"Error fetching consultations: {e}")
            return Response({"error": str(e)}, status=500)


class ResolveConsultationView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Mark a specific consultation as resolved.",
        tags=["Doctor Consultations"],
        responses={
            200: "Consultation resolved successfully",
            403: "Unauthorized (Not the assigned doctor)",
            404: "Consultation not found",
            500: "Internal server error",
        },
    )
    def post(self, request, room_id):
        doctor_id = request.user.id

        try:
            dynamodb = get_dynamodb_resource()
            consultations_table = dynamodb.Table("DoctorConsultations")

            response = consultations_table.get_item(Key={"ConsultationID": room_id})

            consultation = response.get("Item")

            if not consultation:
                return Response({"error": "Consultation not found"}, status=404)

            if int(consultation["DoctorID"]) != doctor_id:
                return Response({"error": "Unauthorized"}, status=403)

            consultations_table.update_item(
                Key={"ConsultationID": room_id},
                UpdateExpression="SET #status = :status, ResolvedAt = :resolved_at",
                ExpressionAttributeNames={"#status": "Status"},
                ExpressionAttributeValues={
                    ":status": "resolved",
                    ":resolved_at": datetime.now().isoformat(),
                },
            )

            return Response({"message": "Consultation resolved successfully"})

        except Exception as e:
            print(f"Error resolving consultation: {e}")
            return Response({"error": str(e)}, status=500)


def post(self, request):
    file_obj = request.data.get("file")
    room_id = request.data.get("room_id")

    if not file_obj or not room_id:
        return Response({"error": "File and room_id required"}, status=400)

    ext = os.path.splitext(file_obj.name)[1]
    if not ext:
        if "audio" in file_obj.content_type:
            ext = ".webm"
        elif "video" in file_obj.content_type:
            ext = ".mp4"
        elif "image" in file_obj.content_type:
            ext = ".jpg"

    safe_name = f"{os.path.splitext(file_obj.name)[0]}{ext}"

    tmp_dir = os.path.join(settings.BASE_DIR, "tmp")
    os.makedirs(tmp_dir, exist_ok=True)
    file_path = os.path.join(tmp_dir, safe_name)

    with open(file_path, "wb+") as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)

    process_file_upload.delay(
        file_path=file_path,
        room_name=room_id,
        user_id=request.user.id,
        original_filename=safe_name,
    )

    return Response({"message": "Upload started", "status": "processing"}, status=202)


class AdminDoctorConsultationListView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Admin view to fetch a list of consultations for a specific doctor.",
        tags=["Admin Consultations"],
        manual_parameters=[
            openapi.Parameter(
                "status",
                openapi.IN_QUERY,
                description="Filter by consultation status (e.g., 'active', 'resolved')",
                type=openapi.TYPE_STRING,
                default="active",
            )
        ],
        responses={
            200: "List of doctor consultations",
            400: "Invalid doctor ID format",
            500: "Internal server error",
        },
    )
    def get(self, request, doctor_id):
        try:

            doc_id = int(doctor_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid doctor ID format"}, status=400)

        status_filter = request.query_params.get("status", "active")

        try:
            dynamodb = get_dynamodb_resource()
            consultations_table = dynamodb.Table("DoctorConsultations")

            response = consultations_table.query(
                IndexName="DoctorStatusIndex",
                KeyConditionExpression="DoctorID = :doc_id AND #status = :status",
                ExpressionAttributeNames={"#status": "Status"},
                ExpressionAttributeValues={":doc_id": doc_id, ":status": status_filter},
            )

            consultations = response.get("Items", [])

            consultations.sort(key=lambda x: x.get("LastMessageTime", ""), reverse=True)

            for consult in consultations:
                consult["patient_data"] = {
                    "id": int(consult["PatientID"]),
                    "username": f"User {consult['PatientID']}",
                }

            return Response(consultations)

        except Exception as e:
            print(f"Error fetching consultations for admin: {e}")
            return Response({"error": str(e)}, status=500)


class AdminConsultationMessagesView(APIView):
    authentication_classes = [StatelessTokenAuthentication]
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Admin view to fetch all chat messages for a specific consultation room.",
        tags=["Admin Consultations"],
        responses={
            200: "List of messages in the consultation room",
            500: "Internal server error",
        },
    )
    def get(self, request, room_id):
        try:
            dynamodb = get_dynamodb_resource()
            messages_table = dynamodb.Table("ChatHistory")

            response = messages_table.query(
                KeyConditionExpression=Key("RoomID").eq(room_id)
            )

            messages = response.get("Items", [])

            messages.sort(key=lambda x: x.get("Timestamp", x.get("CreatedAt", "")))

            return Response(messages)

        except Exception as e:
            print(f"Error fetching messages for admin: {e}")
            return Response({"error": str(e)}, status=500)
