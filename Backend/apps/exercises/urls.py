from django.urls import path

from .views import (
    AdminExerciseDetailView,
    AdminExerciseListView,
    AdminExerciseVerifyView,
    CreateExerciseView,
    ExerciseDetailView,
)

urlpatterns = [
    path("<int:pk>/", ExerciseDetailView.as_view(), name="exercise-detail"),
    path("create/", CreateExerciseView.as_view(), name="create-exercise"),
    path("admin/manage/", AdminExerciseListView.as_view(), name="admin-exercise-list"),
    path(
        "admin/manage/<int:pk>/",
        AdminExerciseDetailView.as_view(),
        name="admin-exercise-detail",
    ),
    path(
        "admin/manage/<int:pk>/verify/",
        AdminExerciseVerifyView.as_view(),
        name="admin-exercise-verify",
    ),
]
