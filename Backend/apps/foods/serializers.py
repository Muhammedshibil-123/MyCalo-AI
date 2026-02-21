from rest_framework import serializers
from .models import FoodItem,FoodImage,FoodVote
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .models import FoodItem, FoodImage
from .serializers import AdminFoodItemSerializer
from apps.admin_panel.views import IsAdminOrEmployee


class FoodImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodImage
        fields = ["id", "image"]


class FoodItemSerializer(serializers.ModelSerializer):
    images = FoodImageSerializer(many=True, read_only=True)  

    class Meta:
        model = FoodItem
        fields = "__all__"
        read_only_fields = ["is_verified", "created_by"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        return super().create(validated_data)
    
class VoteSerializer(serializers.Serializer):
    vote_type = serializers.ChoiceField(choices=['upvote', 'downvote'])


class AdminFoodPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class AdminFoodListView(APIView):
    """
    Handles listing, searching, sorting, paginating, and creating food items for ADMINS.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        queryset = FoodItem.objects.all().prefetch_related('images')

        # 1. Search by name
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        # 2. Sort by votes
        sort_order = request.query_params.get('sort', '-votes')
        if sort_order in ['votes', '-votes']:
            queryset = queryset.order_by(sort_order)
        else:
            queryset = queryset.order_by('-created_at')

        # 3. Paginate
        paginator = AdminFoodPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        serializer = AdminFoodItemSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        # Create new food item
        serializer = AdminFoodItemSerializer(data=request.data)
        if serializer.is_valid():
            # Save as ADMIN source automatically
            food = serializer.save(created_by=request.user, source="ADMIN")
            
            # Handle multiple image uploads
            images = request.FILES.getlist('images')
            for img in images:
                FoodImage.objects.create(food=food, image=img)
                
            return Response(AdminFoodItemSerializer(food).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminFoodDetailView(APIView):
    """
    Handles editing and deleting a specific food item for ADMINS.
    """
    permission_classes = [IsAdminOrEmployee]

    def get_object(self, pk):
        try:
            return FoodItem.objects.get(pk=pk)
        except FoodItem.DoesNotExist:
            return None

    def put(self, request, pk):
        food = self.get_object(pk)
        if not food:
            return Response({"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AdminFoodItemSerializer(food, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Allow adding more images during edit
            images = request.FILES.getlist('images')
            for img in images:
                FoodImage.objects.create(food=food, image=img)
                
            return Response(AdminFoodItemSerializer(food).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        food = self.get_object(pk)
        if not food:
            return Response({"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND)
        food.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminFoodVerifyView(APIView):
    """
    Toggles the verification status of a food item.
    """
    permission_classes = [IsAdminOrEmployee]

    def patch(self, request, pk):
        try:
            food = FoodItem.objects.get(pk=pk)
        except FoodItem.DoesNotExist:
            return Response({"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND)
        
        food.is_verified = not food.is_verified
        # Automatically set source to ADMIN when verified
        if food.is_verified:
            food.source = "ADMIN"
            
        food.save()
        serializer = AdminFoodItemSerializer(food)
        return Response(serializer.data)
