from django.urls import path
from .views import UpdateProfileView,MyProfileView,WeightHistoryView

urlpatterns = [
    path('update/', UpdateProfileView.as_view(), name='profile-update'),
    path("me/", MyProfileView.as_view(), name="profile-me"),
    path("weight-history/", WeightHistoryView.as_view(), name="weight-history"),
]