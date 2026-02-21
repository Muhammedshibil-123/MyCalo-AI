from django.urls import path

from .views import (
    ActiveChatsView,
    ExercisesCountView,
    FoodsCountView,
    FoodSourceDistributionView,
    PlatformGrowthView,
    TopFoodsView,
    UserManagementDetailView,
    UserManagementListView,
    UsersCountView,
)

urlpatterns = [
    path("users-count/", UsersCountView.as_view(), name="admin-users-count"),
    path("foods-count/", FoodsCountView.as_view(), name="admin-foods-count"),
    path(
        "exercises-count/", ExercisesCountView.as_view(), name="admin-exercises-count"
    ),
    path("active-chats/", ActiveChatsView.as_view(), name="admin-active-chats"),
    path(
        "food-source-distribution/",
        FoodSourceDistributionView.as_view(),
        name="admin-food-source-distribution",
    ),
    path(
        "platform-growth/", PlatformGrowthView.as_view(), name="admin-platform-growth"
    ),
    path("top-foods/", TopFoodsView.as_view(), name="admin-top-foods"),
    path(
        "users-management/", UserManagementListView.as_view(), name="admin-users-list"
    ),
    path(
        "users-management/<int:pk>/",
        UserManagementDetailView.as_view(),
        name="admin-users-detail",
    ),
]
