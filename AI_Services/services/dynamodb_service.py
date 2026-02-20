import boto3
import os
from datetime import datetime
from config import settings

def get_dynamodb_resource():
    # Use the same endpoint as your RealTime service
    endpoint = os.getenv('DYNAMODB_ENDPOINT', 'http://dynamodb-local:8000')
    return boto3.resource(
        'dynamodb',
        region_name='us-east-1',
        endpoint_url=endpoint,
        aws_access_key_id='local',
        aws_secret_access_key='local'
    )

def save_ai_chat_message(user_id, message, sender_type):
    """
    Saves a message and keeps the last 100 entries per user.
    sender_type: 'user' or 'ai'
    """
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table('AIChatHistory')
        room_id = f"AI_{user_id}"
        timestamp = datetime.now().isoformat()

        table.put_item(
            Item={
                'RoomID': room_id,
                'Timestamp': timestamp,
                'SenderID': user_id,
                'SenderType': sender_type,
                'Message': message
            }
        )
        response = table.query(
            KeyConditionExpression="RoomID = :rid",
            ExpressionAttributeValues={":rid": room_id},
            ScanIndexForward=True
        )
        messages = response.get('Items', [])
        CAPACITY = 100
        
        if len(messages) > CAPACITY:
            messages_to_delete = messages[:len(messages) - CAPACITY]
            with table.batch_writer() as batch:
                for msg in messages_to_delete:
                    batch.delete_item(Key={'RoomID': msg['RoomID'], 'Timestamp': msg['Timestamp']})
        
        print(f"[DYNAMO] Message saved for User {user_id}. History size: {len(messages)}")
    except Exception as e:
        print(f"[DYNAMO ERROR] {e}")

def get_ai_chat_history(user_id):
    """Retrieves the last 100 messages for the frontend to display"""
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table('AIChatHistory')
        response = table.query(
            KeyConditionExpression="RoomID = :rid",
            ExpressionAttributeValues={":rid": f"AI_{user_id}"},
            ScanIndexForward=True
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"[DYNAMO HISTORY ERROR] {e}")
        return []