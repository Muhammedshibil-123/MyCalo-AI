import boto3
import json
from django.conf import settings

def send_to_email_queue(subject, body, recipient_email):
    try:
        print(f"--- ATTEMPTING TO SEND EMAIL TO {recipient_email} VIA SQS ---")
        
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
        
        print(f"✅ SUCCESS! Message pushed to SQS. ID: {response.get('MessageId')}")
        return response
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR SQS: {str(e)}")
        # This will force the frontend to see a 500 error instead of a fake 200 OK
        raise e