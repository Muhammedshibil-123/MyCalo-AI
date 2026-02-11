from django.db import transaction
from django.db.models import F
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response

from .models import FoodItem, FoodVote
from .serializers import FoodItemSerializer, VoteSerializer


# Create your views here.
class FoodDetailView(generics.RetrieveAPIView):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class FoodVoteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = VoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vote_action = serializer.validated_data['vote_type']
        
        vote_val = 1 if vote_action == 'upvote' else -1
        
        try:
            food = FoodItem.objects.get(pk=pk)
        except FoodItem.DoesNotExist:
            return Response({"error": "Food not found"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            vote_obj, created = FoodVote.objects.select_for_update().get_or_create(
                user=request.user, 
                food=food,
                defaults={'value': vote_val}
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
                FoodItem.objects.filter(pk=pk).update(votes=F('votes') + score_delta)
                food.refresh_from_db()

        return Response({
            "message": "Vote registered", 
            "total_votes": food.votes,
            "user_vote": vote_val if not (not created and score_delta == -vote_val) else None
        }, status=status.HTTP_200_OK)


