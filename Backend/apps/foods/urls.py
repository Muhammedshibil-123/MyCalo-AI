from django.urls import include, path

from .views import FoodDetailView

urlpatterns = [
    path("<int:pk>/", FoodDetailView.as_view(), name="food-detail"),
]
