from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from .models import Exercise
from .serializers import ExerciseSerializer


class CreateExerciseView(generics.CreateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Create a new exercise logged by a user.",
        tags=["Exercises"],
        request_body=ExerciseSerializer,
        responses={
            201: ExerciseSerializer,
            400: "Bad Request (Validation errors)"
        }
    )

    def perform_create(self, serializer):
        serializer.save()


class CreateExerciseView(generics.CreateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()


class IsAdminEmployeeOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["admin", "employee", "doctor"]
        )


class AdminExercisePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminExerciseListView(APIView):
    permission_classes = [IsAdminEmployeeOrDoctor]

    @swagger_auto_schema(
        operation_description="Get a paginated list of exercises. Supports searching by name and sorting by met_value.",
        tags=["Admin Exercises"],
        manual_parameters=[
            openapi.Parameter(
                'search', 
                openapi.IN_QUERY, 
                description="Search term for exercise name", 
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'sort', 
                openapi.IN_QUERY, 
                description="Sort order (e.g., 'met_value', '-met_value')", 
                type=openapi.TYPE_STRING,
                default="-id"
            )
        ],
        responses={200: "Paginated list of exercises"}
    )

    def get(self, request):
        queryset = Exercise.objects.all()

        search_query = request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        sort_order = request.query_params.get("sort", "-id")
        if sort_order in ["met_value", "-met_value"]:
            queryset = queryset.order_by(sort_order)
        else:
            queryset = queryset.order_by("-id")

        paginator = AdminExercisePagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        serializer = ExerciseSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Create a new exercise as an admin, employee, or doctor.",
        tags=["Admin Exercises"],
        request_body=ExerciseSerializer,
        responses={
            201: ExerciseSerializer,
            400: "Bad Request"
        }
    )

    def post(self, request):
        serializer = ExerciseSerializer(data=request.data)
        if serializer.is_valid():

            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminExerciseDetailView(APIView):
    permission_classes = [IsAdminEmployeeOrDoctor]

    def get_object(self, pk):
        try:
            return Exercise.objects.get(pk=pk)
        except Exercise.DoesNotExist:
            return None
        
    @swagger_auto_schema(
        operation_description="Update an exercise's details.",
        tags=["Admin Exercises"],
        request_body=ExerciseSerializer,
        responses={
            200: ExerciseSerializer,
            400: "Bad Request",
            404: "Exercise not found"
        }
    )

    def put(self, request, pk):
        exercise = self.get_object(pk)
        if not exercise:
            return Response(
                {"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ExerciseSerializer(exercise, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Delete an exercise from the database.",
        tags=["Admin Exercises"],
        responses={
            204: "No Content",
            404: "Exercise not found"
        }
    )

    def delete(self, request, pk):
        exercise = self.get_object(pk)
        if not exercise:
            return Response(
                {"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND
            )
        exercise.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminExerciseVerifyView(APIView):
    permission_classes = [IsAdminEmployeeOrDoctor]

    @swagger_auto_schema(
        operation_description="Toggle the verification status of an exercise.",
        tags=["Admin Exercises"],
        responses={
            200: ExerciseSerializer,
            404: "Exercise not found"
        }
    )

    def patch(self, request, pk):
        try:
            exercise = Exercise.objects.get(pk=pk)
        except Exercise.DoesNotExist:
            return Response(
                {"error": "Exercise not found"}, status=status.HTTP_404_NOT_FOUND
            )

        exercise.is_verified = not exercise.is_verified
        exercise.save()

        serializer = ExerciseSerializer(exercise)
        return Response(serializer.data)


class ExerciseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Retrieve details of a specific exercise by its ID.",
        tags=["Exercises"],
        responses={
            200: ExerciseSerializer,
            404: "Exercise not found"
        }
    )

    def get_object(self, pk):
        try:
            return Exercise.objects.get(pk=pk)
        except Exercise.DoesNotExist:
            return None

    def get(self, request, pk):
        exercise = self.get_object(pk)
        if not exercise:
            return Response(
                {"error": "Exercise not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ExerciseSerializer(exercise)
        return Response(serializer.data, status=status.HTTP_200_OK)