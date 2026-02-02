from django.urls import include, path

from .views import UnifiedSearchView

urlpatterns = [
    path("search/", UnifiedSearchView.as_view(), name="search"),
]
