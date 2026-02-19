import boto3
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def send_to_email_queue(subject, body, recipient_email):
    try:
        
        sqs = boto3.client(
            'sqs',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        payload = {
            "subject": subject,
            "body": body,
            "recipient": recipient_email,
            "source": "mycalo-auth-service"
        }
        
        
        response = sqs.send_message(
            QueueUrl=settings.AWS_EMAIL_QUEUE_URL,
            MessageBody=json.dumps(payload)
        )
        return response
    except Exception as e:
        logger.error(f"Failed to push email to SQS: {str(e)}")
        return None
