from django.urls import include, path

from .views import CreateCustomFoodView,AIAnalyzeFoodView, LogFoodView,FoodDetailView

urlpatterns = [
    path("create/", CreateCustomFoodView.as_view(), name="food_create"),

    path('analyze/', AIAnalyzeFoodView.as_view(), name='ai-analyze'),
    path('log/', LogFoodView.as_view(), name='log-food'),
    path('<int:pk>/', FoodDetailView.as_view(), name='food-detail'),
]
