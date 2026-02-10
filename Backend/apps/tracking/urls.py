from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DailyLogViewSet,LogAIMealView

router = DefaultRouter()
router.register(r"logs", DailyLogViewSet, basename="daily-logs")

urlpatterns = [
    path("", include(router.urls)),
    path('log-ai-meal/', LogAIMealView.as_view(), name='log-ai-meal'),
]
