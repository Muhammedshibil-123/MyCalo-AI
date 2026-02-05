from django.urls import include, path

from .views import CreateCustomFoodView, LogFoodView,FoodDetailView

urlpatterns = [
    path("create/", CreateCustomFoodView.as_view(), name="food_create"),
    path('log/', LogFoodView.as_view(), name='log-food'),
    path('<int:pk>/', FoodDetailView.as_view(), name='food-detail'),
]
