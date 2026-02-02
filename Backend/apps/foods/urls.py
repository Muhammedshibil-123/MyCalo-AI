from django.urls import include, path

from .views import CreateCustomFoodView

urlpatterns = [
    path("food/create/", CreateCustomFoodView.as_view(), name="food_create"),
]
