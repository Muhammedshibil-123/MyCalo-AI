from django.db import transaction
from django.db.models import F
from rest_framework import generics, permissions, status, views
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FoodImage, FoodItem, FoodVote
from .serializers import AdminFoodItemSerializer, FoodItemSerializer, VoteSerializer


class IsAdminEmployeeOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["admin", "employee", "doctor"]
        )


class FoodDetailView(generics.RetrieveAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class FoodVoteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = VoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vote_action = serializer.validated_data["vote_type"]

        vote_val = 1 if vote_action == "upvote" else -1

        try:
            food = FoodItem.objects.get(pk=pk)
        except FoodItem.DoesNotExist:
            return Response(
                {"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            vote_obj, created = FoodVote.objects.select_for_update().get_or_create(
                user=request.user, food=food, defaults={"value": vote_val}
            )

            score_delta = 0

            if created:
                score_delta = vote_val
            else:
                if vote_obj.value == vote_val:
                    score_delta = -vote_obj.value
                    vote_obj.delete()
                else:
                    score_delta = vote_val - vote_obj.value
                    vote_obj.value = vote_val
                    vote_obj.save()

            if score_delta != 0:
                FoodItem.objects.filter(pk=pk).update(votes=F("votes") + score_delta)
                food.refresh_from_db()

        return Response(
            {
                "message": "Vote registered",
                "total_votes": food.votes,
                "user_vote": (
                    vote_val if not (not created and score_delta == -vote_val) else None
                ),
            },
            status=status.HTTP_200_OK,
        )


class AdminFoodPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminFoodListView(APIView):
    permission_classes = [IsAdminEmployeeOrDoctor]

    def get(self, request):
        queryset = FoodItem.objects.all().prefetch_related("images")

        search_query = request.query_params.get("search", "").strip()
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        sort_order = request.query_params.get("sort", "-votes")
        if sort_order in ["votes", "-votes"]:
            queryset = queryset.order_by(sort_order)
        else:
            queryset = queryset.order_by("-created_at")

        paginator = AdminFoodPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        serializer = AdminFoodItemSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = AdminFoodItemSerializer(data=request.data)
        if serializer.is_valid():
            source_type = (
                "ADMIN" if request.user.role in ["admin", "employee"] else "DOCTOR"
            )

            food = serializer.save(created_by=request.user, source=source_type)
            images = request.FILES.getlist("images")
            for img in images:
                FoodImage.objects.create(food=food, image=img)
            return Response(
                AdminFoodItemSerializer(food).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminFoodDetailView(APIView):
    permission_classes = [IsAdminEmployeeOrDoctor]

    def get_object(self, pk):
        try:
            return FoodItem.objects.get(pk=pk)
        except FoodItem.DoesNotExist:
            return None

    def put(self, request, pk):
        food = self.get_object(pk)
        if not food:
            return Response(
                {"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = AdminFoodItemSerializer(food, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            images = request.FILES.getlist("images")
            for img in images:
                FoodImage.objects.create(food=food, image=img)
            return Response(AdminFoodItemSerializer(food).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        food = self.get_object(pk)
        if not food:
            return Response(
                {"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND
            )
        food.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminFoodVerifyView(APIView):
    permission_classes = [IsAdminEmployeeOrDoctor]

    def patch(self, request, pk):
        try:
            food = FoodItem.objects.get(pk=pk)
        except FoodItem.DoesNotExist:
            return Response(
                {"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND
            )

        food.is_verified = not food.is_verified
        if food.is_verified:
            food.source = "ADMIN"

        food.save()
        serializer = AdminFoodItemSerializer(food)
        return Response(serializer.data)


class AdminFoodImageDeleteView(APIView):

    permission_classes = [IsAdminEmployeeOrDoctor]

    def delete(self, request, pk):
        try:
            image = FoodImage.objects.get(pk=pk)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FoodImage.DoesNotExist:
            return Response(
                {"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND
            )
