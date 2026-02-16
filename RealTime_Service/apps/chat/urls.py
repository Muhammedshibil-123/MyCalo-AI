from django.urls import path
from .views import ChatMediaUploadView,DoctorConsultationListView,ResolveConsultationView

urlpatterns = [
    path('upload/', ChatMediaUploadView.as_view(), name='chat-media-upload'),
    path('doctor-consultations/', DoctorConsultationListView.as_view(), name='doctor-consultations'),
    path('resolve/<str:room_id>/', ResolveConsultationView.as_view(), name='resolve-consultation'),
]