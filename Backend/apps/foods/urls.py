from django.urls import include, path

from .views import CreateCustomFoodView, FoodDetailView

urlpatterns = [
    path("create/", CreateCustomFoodView.as_view(), name="food_create"),
    path("<int:pk>/", FoodDetailView.as_view(), name="food-detail"),
]
