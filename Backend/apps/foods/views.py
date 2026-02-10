from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


from .models import FoodItem
from .serializers import FoodItemSerializer


# Create your views here.
class CreateCustomFoodView(generics.CreateAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_public=False)


class FoodDetailView(generics.RetrieveAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]


