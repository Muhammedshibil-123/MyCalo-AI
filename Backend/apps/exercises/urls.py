from django.urls import path
from .views import CreateExerciseView

urlpatterns = [
    path('create/', CreateExerciseView.as_view(), name='create-exercise'),
]