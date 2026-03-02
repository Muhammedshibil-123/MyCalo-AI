import json

import boto3
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.tracking.models import DailyLog

User = get_user_model()


@shared_task
def check_missing_meals(meal_type):
    today = timezone.now().date()

    users_with_logs = DailyLog.objects.filter(
        date=today, meal_type=meal_type
    ).values_list("user_id", flat=True)

    users_without_logs = User.objects.exclude(id__in=users_with_logs).filter(
        is_active=True
    )

    sqs = boto3.client(
        "sqs",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    queue_url = settings.AWS_MEAL_REMINDER_QUEUE_URL

    for user in users_without_logs:

        if hasattr(user, "profile") and user.profile.fcm_token:
            fcm_token = user.profile.fcm_token

            payload = {
                "user_id": user.id,
                "fcm_token": fcm_token,
                "title": f"MyCalo AI: Don't forget your {meal_type.title()}!",
                "body": f"Hey {user.first_name or 'there'}, it's time to log your {meal_type.lower()} to stay on track.",
            }

            sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(payload))
            print(f"Queued notification for User {user.id} regarding {meal_type}")
        else:

            continue


@shared_task
def send_broadcast_notification(title, message):
    User = get_user_model()

    active_users = User.objects.filter(is_active=True).select_related("profile")

    sqs = boto3.client(
        "sqs",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    queue_url = settings.AWS_MEAL_REMINDER_QUEUE_URL

    count = 0
    for user in active_users:
        if hasattr(user, "profile") and getattr(user.profile, "fcm_token", None):
            fcm_token = user.profile.fcm_token

            payload = {
                "user_id": user.id,
                "fcm_token": fcm_token,
                "title": title,
                "body": message,
            }

            sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(payload))
            count += 1

    print(f"Queued broadcast notification for {count} users.")
    return f"Sent to {count} users"
