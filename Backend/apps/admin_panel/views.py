from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.foods.models import FoodItem
from apps.exercises.models import Exercise
from apps.tracking.models import DailyLog


class IsAdminOrEmployee(IsAuthenticated):
    """
    Custom permission to only allow admins and employees to access these views.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['admin', 'employee']


class UsersCountView(APIView):
    """
    Returns total users, doctors, and employees count.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        total_users = CustomUser.objects.filter(is_active=True).count()
        doctors = CustomUser.objects.filter(role='doctor', is_active=True).count()
        employees = CustomUser.objects.filter(role='employee', is_active=True).count()
        
        return Response({
            'total': total_users,
            'doctors': doctors,
            'employees': employees
        })


class FoodsCountView(APIView):
    """
    Returns total food items count.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        count = FoodItem.objects.count()
        return Response({'count': count})


class ExercisesCountView(APIView):
    """
    Returns total exercises count.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        count = Exercise.objects.count()
        return Response({'count': count})


class ActiveChatsView(APIView):
    """
    Returns count of active consultations.
    This is a placeholder - you'll need to implement based on your chat model.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        # TODO: Replace with actual chat/consultation model query
        # For now, returning a placeholder
        count = 0
        
        # If you have a Consultation model, use something like:
        # from apps.consultations.models import Consultation
        # count = Consultation.objects.filter(status='active').count()
        
        return Response({'count': count})


class FoodSourceDistributionView(APIView):
    """
    Returns distribution of food items by source (AI, USER, ADMIN, UNKNOWN).
    For doughnut chart.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        distribution = FoodItem.objects.values('source').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Format for frontend chart
        data = [
            {
                'source': item['source'],
                'count': item['count']
            }
            for item in distribution
        ]
        
        return Response(data)


class PlatformGrowthView(APIView):
    """
    Returns daily signup data grouped by user role for the last 30 days.
    For area chart showing platform growth.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        # Get date range (last 30 days)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Get daily signups grouped by role
        signups = CustomUser.objects.filter(
            date_joined__date__gte=start_date,
            date_joined__date__lte=end_date
        ).annotate(
            date=TruncDate('date_joined')
        ).values('date', 'role').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Create a dictionary to hold all dates
        date_dict = {}
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%b %d')
            date_dict[date_str] = {
                'date': date_str,
                'user': 0,
                'doctor': 0,
                'employee': 0,
                'admin': 0
            }
            current_date += timedelta(days=1)
        
        # Fill in actual data
        for signup in signups:
            date_str = signup['date'].strftime('%b %d')
            role = signup['role']
            if date_str in date_dict and role in date_dict[date_str]:
                date_dict[date_str][role] = signup['count']
        
        # Convert to list for chart
        data = list(date_dict.values())
        
        return Response(data)


class TopFoodsView(APIView):
    """
    Returns top 10 most consumed foods based on DailyLog entries.
    For leaderboard.
    """
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        # Get top consumed foods
        top_foods = DailyLog.objects.values(
            'food_item__id',
            'food_item__name',
            'food_item__calories',
            'food_item__source'
        ).annotate(
            consumption_count=Count('id')
        ).order_by('-consumption_count')[:10]
        
        # Format for frontend
        data = [
            {
                'id': food['food_item__id'],
                'name': food['food_item__name'],
                'calories': food['food_item__calories'],
                'source': food['food_item__source'],
                'consumption_count': food['consumption_count']
            }
            for food in top_foods
        ]
        
        return Response(data)