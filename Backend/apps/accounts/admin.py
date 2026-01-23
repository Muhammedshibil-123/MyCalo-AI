from django.contrib import admin
from .models import CustomUser

# Register your models here.
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display=('username','email','role','status','is_active')
    search_fields=('username','email')
    list_filter=('role','is_active','status')