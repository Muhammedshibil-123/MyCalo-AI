from rest_framework import generics, permissions


from .models import FoodItem
from .serializers import FoodItemSerializer


# Create your views here.
class FoodDetailView(generics.RetrieveAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]


