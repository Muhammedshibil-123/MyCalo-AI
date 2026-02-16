from django.urls import path
from .views import ChatMediaUploadView,DoctorConsultationListView

urlpatterns = [
    path('upload/', ChatMediaUploadView.as_view(), name='chat-media-upload'),
    path('doctor-consultations/', DoctorConsultationListView.as_view(), name='doctor-consultations'),
]