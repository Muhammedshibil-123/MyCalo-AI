from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DailyLogViewSet, LogAIMealView, LogManualFoodView,LogExerciseView,ExerciseLogListView,ExerciseLogDetailView,PatientDailyLogView,PatientExerciseLogView

router = DefaultRouter()
router.register(r"logs", DailyLogViewSet, basename="daily-logs")

urlpatterns = [
    path("", include(router.urls)),
    path("log-ai-meal/", LogAIMealView.as_view(), name="log-ai-meal"),
    path("log-manual/", LogManualFoodView.as_view(), name="log-manual"),
    path("log-exercise/", LogExerciseView.as_view(), name="log-exercise"),
    path("exercise-logs/", ExerciseLogListView.as_view(), name="exercise-log-list"),
    path("exercise-logs/<int:pk>/", ExerciseLogDetailView.as_view(), name="exercise-log-detail"),
    path("patient-logs/<int:user_id>/", PatientDailyLogView.as_view(), name="patient-logs"),
    path("patient-exercise-logs/<int:user_id>/", PatientExerciseLogView.as_view(), name="patient-exercise-logs"),
]
