from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Profile, WeightHistory,DoctorProfile, EmployeeProfile
from .serializers import ProfileUpdateSerializer, WeightHistorySerializer,DoctorProfileSerializer,EmployeeProfileSerializer


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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


class WeightHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = WeightHistory.objects.filter(user=request.user)
        serializer = WeightHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        weight = request.data.get("weight")
        if not weight:
            return Response(
                {"error": "Weight is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            weight = float(weight)
        except ValueError:
            return Response(
                {"error": "Invalid weight format"}, status=status.HTTP_400_BAD_REQUEST
            )

        profile, created = Profile.objects.get_or_create(user=request.user)
        profile.weight = weight
        profile.save()

        WeightHistory.objects.create(user=request.user, weight=weight)

        return Response(
            {"message": "Weight updated successfully", "weight": weight},
            status=status.HTTP_201_CREATED,
        )


class PatientProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        try:
            profile = Profile.objects.get(user__id=patient_id)
            serializer = ProfileUpdateSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND
            )


class RoleBasedProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, user):
        if user.role == "doctor":
            profile, _ = DoctorProfile.objects.get_or_create(user=user)
            return profile, DoctorProfileSerializer
        elif user.role in ["employee", "admin"]:
            profile, _ = EmployeeProfile.objects.get_or_create(user=user)
            return profile, EmployeeProfileSerializer
        else:
            profile, _ = Profile.objects.get_or_create(user=user)
            return profile, ProfileUpdateSerializer

    @swagger_auto_schema(
        operation_description="Get the profile details for the currently logged-in user.",
        responses={200: DoctorProfileSerializer}
    )
    def get(self, request):
        instance, serializer_class = self.get_object(request.user)
        serializer = serializer_class(instance)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Create or fully update the profile. Use multipart/form-data if uploading a photo.",
        request_body=DoctorProfileSerializer,
        responses={201: "Created", 400: "Bad Request"}
    )
    def post(self, request):
        instance, serializer_class = self.get_object(request.user)
        
        serializer = serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Partially update profile details.",
        request_body=DoctorProfileSerializer,
        responses={200: "Updated", 400: "Bad Request"}
    )
    def patch(self, request):
        instance, serializer_class = self.get_object(request.user)
        serializer = serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Test CI/CD trigger.
