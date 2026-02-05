from rest_framework import generics, permissions

from .models import Exercise
from .serializers import ExerciseSerializer


# Create your views here.
class CreateExerciseView(generics.CreateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
