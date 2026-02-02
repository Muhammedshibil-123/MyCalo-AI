from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q


from apps.foods.models import FoodItem
from apps.exercises.models import Exercise

from apps.foods.serializers import FoodItemSerializer
from apps.exercises.serializers import ExerciseSerializer

# Create your views here.
class UnifiedSearchView(APIView):
    permission_classes = [permissions.AllowAny] 

    def get(self, request):
        query = request.GET.get('q', '')
        search_type = request.GET.get('type', 'food')

        if not query:
            return Response([])

        if search_type == 'exercise':
            exercises = Exercise.objects.filter(
                Q(name__icontains=query) | Q(is_verified=True)
            )[:20] 
            serializer = ExerciseSerializer(exercises, many=True)
            return Response(serializer.data)
        
        else:
            foods = FoodItem.objects.filter(
                (Q(name__icontains=query)) & 
                (Q(is_public=True) | Q(created_by=request.user))
            ).order_by('-is_verified')[:20]
            
            serializer = FoodItemSerializer(foods, many=True)
            return Response(serializer.data)