from django.urls import include, path

from .views import FoodDetailView,FoodVoteView,AdminFoodListView,AdminFoodDetailView,AdminFoodVerifyView

urlpatterns = [
    path("<int:pk>/", FoodDetailView.as_view(), name="food-detail"),
    path("<int:pk>/vote/", FoodVoteView.as_view(), name="food-vote"),
    path('admin/manage/', AdminFoodListView.as_view(), name='admin-food-list'),
    path('admin/manage/<int:pk>/', AdminFoodDetailView.as_view(), name='admin-food-detail'),
    path('admin/manage/<int:pk>/verify/', AdminFoodVerifyView.as_view(), name='admin-food-verify'),


]
