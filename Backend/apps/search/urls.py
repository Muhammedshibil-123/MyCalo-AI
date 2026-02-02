from django.urls import include, path

from .views import UnifiedSearchView

urlpatterns = [
    path("", UnifiedSearchView.as_view(), name="search"),
]
