from cloudinary.models import CloudinaryField
from django.conf import settings
from django.db import models


class Profile(models.Model):
    GENDER_CHOICES = (("M", "Male"), ("F", "Female"))
    GOAL_CHOICES = (
        ("LOSE", "Weight Loss"),
        ("MAINTAIN", "Maintenance"),
        ("GAIN", "Muscle Gain"),
    )
    ACTIVITY_CHOICES = (
        (1.2, "Mostly Sitting (Sedentary)"),
        (1.375, "Lightly Active"),
        (1.55, "Moderately Active"),
        (1.725, "Very Active"),
        (1.9, "Extremely Active"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    
    fcm_token = models.TextField(null=True, blank=True)

    
    name = models.CharField(max_length=120, blank=True, default="")
    photo = CloudinaryField("image", blank=True, null=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True)
    height = models.FloatField(help_text="Height in CM", null=True)
    weight = models.FloatField(help_text="Current Weight in KG", null=True)

    target_weight = models.FloatField(
        help_text="Target Weight in KG", null=True, blank=True
    )
    medical_conditions = models.JSONField(
        default=list,
        blank=True,
        help_text="List of conditions e.g. ['Diabetes', 'PCOS']",
    )

    activity_level = models.FloatField(choices=ACTIVITY_CHOICES, default=1.2)
    goal = models.CharField(max_length=10, choices=GOAL_CHOICES, default="MAINTAIN")

    daily_calorie_goal = models.IntegerField(default=0)
    protein_goal = models.IntegerField(default=0)
    carbs_goal = models.IntegerField(default=0)
    fats_goal = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class WeightHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="weight_history",
    )
    weight = models.FloatField()
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"{self.user.username} - {self.weight}kg on {self.date}"




class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="doctor_profile"
    )
    name = models.CharField(max_length=120)
    photo = CloudinaryField("image", blank=True, null=True)
    specialization = models.CharField(max_length=255)
    qualification = models.CharField(max_length=255)  
    experience_years = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    clinic_address = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dr. {self.name} ({self.specialization})"

class EmployeeProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employee_profile"
    )
    name = models.CharField(max_length=120)
    photo = CloudinaryField("image", blank=True, null=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100) 
    employee_id = models.CharField(max_length=50, unique=True)
    education = models.CharField(max_length=255)
    joining_date = models.DateField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.designation}"
