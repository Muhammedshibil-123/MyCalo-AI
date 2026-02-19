# Backend/apps/notifications/tasks.py
import os
import json
import boto3
from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.tracking.models import DailyLog

User = get_user_model()

@shared_task
def check_missing_meals(meal_type):
    today = timezone.now().date()
    
    # 1. Find users who have already logged this meal today
    users_with_logs = DailyLog.objects.filter(
        date=today, 
        meal_type=meal_type
    ).values_list('user_id', flat=True)
    
    # 2. Get active users who haven't logged yet
    users_without_logs = User.objects.exclude(id__in=users_with_logs).filter(is_active=True)
    
    # 3. Connect to AWS SQS using your .env values
    sqs = boto3.client(
        'sqs', 
        region_name=os.getenv('AWS_REGION', 'ap-south-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    queue_url = os.getenv('SQS_QUEUE_URL')
    
    for user in users_without_logs:
        # Now that you added the field to the Profile model, we can grab it
        fcm_token = getattr(user.profile, 'fcm_token', None)
        
        if fcm_token:
            payload = {
                "user_id": user.id,
                "fcm_token": fcm_token,
                "title": f"MyCalo AI: Don't forget your {meal_type.title()}!",
                "body": f"Hey {user.first_name or 'there'}, it's time to log your {meal_type.lower()} to stay on track."
            }
            
            sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(payload)
            )
            print(f"Queued notification for User {user.id} regarding {meal_type}")