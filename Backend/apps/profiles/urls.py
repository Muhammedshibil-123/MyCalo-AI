from django.urls import path
from .views import UpdateProfileView,MyProfileView

urlpatterns = [
    path('update/', UpdateProfileView.as_view(), name='profile-update'),
    path("me/", MyProfileView.as_view(), name="profile-me"),
]