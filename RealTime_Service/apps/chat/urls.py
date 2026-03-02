from django.urls import path
from .views import ChatMediaUploadView,DoctorConsultationListView,ResolveConsultationView,AdminDoctorConsultationListView,AdminConsultationMessagesView

urlpatterns = [
    path('upload/', ChatMediaUploadView.as_view(), name='chat-media-upload'),
    path('doctor-consultations/', DoctorConsultationListView.as_view(), name='doctor-consultations'),
    path('resolve/<str:room_id>/', ResolveConsultationView.as_view(), name='resolve-consultation'),
    path('admin/doctor-consultations/<int:doctor_id>/', AdminDoctorConsultationListView.as_view(), name='admin-doctor-consultations'),
    path('admin/consultation-messages/<str:room_id>/', AdminConsultationMessagesView.as_view(), name='admin-consultation-messages'),
]