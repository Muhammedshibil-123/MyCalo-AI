from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.foods.models import FoodItem
from apps.exercises.models import Exercise
from apps.foods.serializers import FoodItemSerializer
from apps.exercises.serializers import ExerciseSerializer
from django.db.models import Q

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


# Create your views here.
class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'q', 
                openapi.IN_QUERY, 
                description="Search keyword (e.g., 'chicken', 'run')", 
                type=openapi.TYPE_STRING,
                required=True
            ),
            openapi.Parameter(
                'type', 
                openapi.IN_QUERY, 
                description="Type of search: 'foods' or 'exercises' (default: foods)", 
                type=openapi.TYPE_STRING
            ),
        ],
        responses={200: "List of foods or exercises"}
    )

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'foods')

        if not query:
            return Response([])
        
        LIMIT = 15

        if search_type == 'exercises':
            exercises = Exercise.objects.filter(
                name__icontains=query
            )[:LIMIT]
            serializer = ExerciseSerializer(exercises, many=True)
            return Response(serializer.data)

        else:
            foods = FoodItem.objects.filter(
                Q(name__icontains=query) | Q(brand__icontains=query)
            ).filter(
                name__icontains=query
            ).distinct()[:LIMIT]
            
            serializer = FoodItemSerializer(foods, many=True)
            return Response(serializer.data)