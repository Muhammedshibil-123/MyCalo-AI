import pytest
from django.contrib.auth import get_user_model

from apps.profiles.models import Profile

User = get_user_model()


@pytest.mark.django_db
class TestProfileLogic:

    def test_standard_tdee_calculation(self):

        user = User.objects.create_user(
            username="testuser", password="password", role="USER"
        )
        profile = user.profile

        profile.gender = "M"
        profile.weight = 80
        profile.height = 180
        profile.age = 25
        profile.activity_level = 1.2
        profile.goal = "MAINTAIN"
        profile.medical_conditions = ["None"]
        profile.save()

        profile.refresh_from_db()

        assert 2160 <= profile.daily_calorie_goal <= 2170
        print(
            f"\n[Test 1] Standard TDEE: {profile.daily_calorie_goal} (Expected ~2166)"
        )

    def test_medical_condition_adjustment(self):

        user = User.objects.create_user(
            username="testuser2", password="password", role="USER"
        )
        profile = user.profile

        profile.gender = "F"
        profile.weight = 80
        profile.height = 180
        profile.age = 25
        profile.activity_level = 1.2
        profile.goal = "MAINTAIN"

        profile.medical_conditions = ["PCOS"]
        profile.save()

        profile.refresh_from_db()

        assert profile.daily_calorie_goal < 2100
        print(
            f"\n[Test 2] PCOS Adjusted TDEE: {profile.daily_calorie_goal} (Lower than 2166)"
        )

    def test_target_weight_storage(self):

        user = User.objects.create_user(
            username="testuser3", password="password", role="USER"
        )
        profile = user.profile

        profile.target_weight = 65.5
        profile.save()

        profile.refresh_from_db()
        assert profile.target_weight == 65.5
        print(f"\n[Test 3] Target Weight Saved: {profile.target_weight}")


@pytest.mark.django_db
class TestProfileSignalLogic:

    def test_profile_created_for_normal_user(self):
        user = User.objects.create_user(
            username="normal_user", password="password", role="USER"
        )
        assert Profile.objects.filter(user=user).exists() == True

    def test_profile_NOT_created_for_doctor(self):
        doctor = User.objects.create_user(
            username="dr_strange", password="password", role="DOCTOR"
        )

        assert Profile.objects.filter(user=doctor).exists() == False
