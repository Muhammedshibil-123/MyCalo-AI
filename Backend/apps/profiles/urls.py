from django.urls import path

from .views import (
    MyProfileView,
    PatientProfileView,
    UpdateProfileView,
    WeightHistoryView,
    RoleBasedProfileView
)

urlpatterns = [
    path("update/", UpdateProfileView.as_view(), name="profile-update"),
    path("me/", MyProfileView.as_view(), name="profile-me"),
    path("weight-history/", WeightHistoryView.as_view(), name="weight-history"),
    path("manage/", RoleBasedProfileView.as_view(), name="profile-manage"),
    path(
        "patient/<int:patient_id>/",
        PatientProfileView.as_view(),
        name="patient-profile",
    ),
]
