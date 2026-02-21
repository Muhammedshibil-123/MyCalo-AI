from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission  
from datetime import timedelta
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.foods.models import FoodItem
from apps.exercises.models import Exercise
from apps.tracking.models import DailyLog

from rest_framework.pagination import PageNumberPagination
from .serializers import AdminFoodItemSerializer



class IsAdminOrEmployee(BasePermission):
    def has_permission(self, request, view):
        
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'employee']
        )


class UsersCountView(APIView):
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
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        count = FoodItem.objects.count()
        return Response({'count': count})


class ExercisesCountView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        count = Exercise.objects.count()
        return Response({'count': count})


class ActiveChatsView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        
        
        count = 0
        
        
        
        
        
        return Response({'count': count})


class FoodSourceDistributionView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        distribution = FoodItem.objects.values('source').annotate(
            count=Count('id')
        ).order_by('-count')
        
        
        data = [
            {
                'source': item['source'],
                'count': item['count']
            }
            for item in distribution
        ]
        
        return Response(data)


class PlatformGrowthView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        
        signups = CustomUser.objects.filter(
            date_joined__date__gte=start_date,
            date_joined__date__lte=end_date
        ).annotate(
            date=TruncDate('date_joined')
        ).values('date', 'role').annotate(
            count=Count('id')
        ).order_by('date')
        
        
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
        
        
        for signup in signups:
            date_str = signup['date'].strftime('%b %d')
            role = signup['role']
            if date_str in date_dict and role in date_dict[date_str]:
                date_dict[date_str][role] = signup['count']
        
        
        data = list(date_dict.values())
        
        return Response(data)


class TopFoodsView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        
        top_foods = DailyLog.objects.values(
            'food_item__id',
            'food_item__name',
            'food_item__calories',
            'food_item__source'
        ).annotate(
            consumption_count=Count('id')
        ).order_by('-consumption_count')[:10]
        
        
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


