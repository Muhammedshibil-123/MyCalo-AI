from django.urls import include, path

from .views import GlobalSearchView

urlpatterns = [
    path("", GlobalSearchView.as_view(), name="search"),
]
