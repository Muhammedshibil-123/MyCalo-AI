from django.urls import include, path

from .views import FoodDetailView,FoodVoteView

urlpatterns = [
    path("<int:pk>/", FoodDetailView.as_view(), name="food-detail"),
    path("<int:pk>/vote/", FoodVoteView.as_view(), name="food-vote"),
]
