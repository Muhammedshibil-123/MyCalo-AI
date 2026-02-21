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
from rest_framework.permissions import IsAuthenticated

from rest_framework.pagination import PageNumberPagination
from .serializers import AdminFoodItemSerializer
from django.db import IntegrityError
from django.shortcuts import get_object_or_404




class IsAdminOrEmployee(BasePermission):
    def has_permission(self, request, view):
        
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'employee']
        )
    
class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'admin'


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




class UserManagementListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        role = request.query_params.get('role', 'user')
        users = CustomUser.objects.filter(role=role).values(
            'id', 'username', 'email', 'role', 'status', 'is_active', 'date_joined'
        ).order_by('-date_joined')
        
        return Response(list(users), status=status.HTTP_200_OK)


class UserManagementDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        action = request.data.get('action')

        if action == 'toggle_block':
            
            user.is_active = not user.is_active
            user.status = 'active' if user.is_active else 'inactive'
            user.save()
            return Response({
                "message": f"User {'unblocked' if user.is_active else 'blocked'} successfully",
                "is_active": user.is_active,
                "status": user.status
            }, status=status.HTTP_200_OK)

        elif action == 'change_role':
            new_role = request.data.get('role')
            valid_roles = dict(CustomUser.Role_Choices).keys()
            
            if new_role in valid_roles:
                user.role = new_role
                user.save()
                return Response({
                    "message": "Role updated successfully",
                    "role": user.role
                }, status=status.HTTP_200_OK)
            return Response({"error": "Invalid role provided"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        
        if user == request.user:
            return Response({"error": "You cannot delete your own account"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
            
        except IntegrityError:
            
            return Response(
                {"error": "Cannot delete this user because they have associated records (logs, chats, etc.) that are protected. Try blocking them instead."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
