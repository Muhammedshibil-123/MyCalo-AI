from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.conf import settings
from .models import Profile

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created and instance.role.lower() == "user":
        Profile.objects.create(user=instance)
    

@receiver(pre_save, sender=Profile)
def calculate_nutrition_goals(sender, instance, **kwargs):
    if instance.weight and instance.height and instance.age and instance.gender:
        
        
        if instance.gender == 'M':
            bmr = (10 * instance.weight) + (6.25 * instance.height) - (5 * instance.age) + 5
        else:
            bmr = (10 * instance.weight) + (6.25 * instance.height) - (5 * instance.age) - 161

        
        tdee = bmr * instance.activity_level

        
        if instance.goal == 'LOSE':
            target_calories = tdee - 200
        elif instance.goal == 'GAIN':
            target_calories = tdee + 200
        else:
            target_calories = tdee

        
        if instance.medical_conditions:
            conditions_lower_metabolism = ['PCOS', 'Thyroid', 'Hypothyroidism']
            if any(c in instance.medical_conditions for c in conditions_lower_metabolism):
                target_calories *= 0.95  

        
        instance.daily_calorie_goal = int(target_calories)

        
        instance.protein_goal = int((target_calories * 0.30) / 4)
        instance.carbs_goal = int((target_calories * 0.43) / 4)
        instance.fats_goal = int((target_calories * 0.27) / 9)
