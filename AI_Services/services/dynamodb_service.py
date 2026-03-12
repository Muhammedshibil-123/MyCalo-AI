import os
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key 

from config import settings


def get_dynamodb_resource():
    endpoint = os.getenv("DYNAMODB_ENDPOINT") or None

    return boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        endpoint_url=endpoint,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def ensure_table_exists():
    """Auto-creates the table in Docker if it doesn't exist yet"""
    dynamodb = get_dynamodb_resource()
    try:
        dynamodb.meta.client.describe_table(TableName="AIChatHistory")
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        print("[DYNAMO] 'AIChatHistory' table not found. Creating it now...")
        dynamodb.create_table(
            TableName="AIChatHistory",
            KeySchema=[
                {"AttributeName": "RoomID", "KeyType": "HASH"}, 
                {"AttributeName": "Timestamp", "KeyType": "RANGE"},  
            ],
            AttributeDefinitions=[
                {"AttributeName": "RoomID", "AttributeType": "S"},
                {"AttributeName": "Timestamp", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        print("[DYNAMO] 'AIChatHistory' table created successfully!")


def save_ai_chat_message(user_id, message, sender_type):
    try:
        ensure_table_exists() 

        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table("AIChatHistory")
        room_id = f"AI_{user_id}"
        timestamp = datetime.now().isoformat()

        table.put_item(
            Item={
                "RoomID": room_id,
                "Timestamp": timestamp,
                "SenderID": user_id,
                "SenderType": sender_type,
                "Message": message,
            }
        )

        
        response = table.query(
            KeyConditionExpression=Key("RoomID").eq(room_id),
            ScanIndexForward=True,
        )
        messages = response.get("Items", [])
        CAPACITY = 100

        if len(messages) > CAPACITY:
            messages_to_delete = messages[: len(messages) - CAPACITY]
            with table.batch_writer() as batch:
                for msg in messages_to_delete:
                    batch.delete_item(
                        Key={"RoomID": msg["RoomID"], "Timestamp": msg["Timestamp"]}
                    )

        print(
            f"[DYNAMO] Message saved for User {user_id}. History size: {len(messages)}"
        )
    except Exception as e:
        print(f"[DYNAMO ERROR - SAVE] {e}")


def get_ai_chat_history(user_id):
    try:
        ensure_table_exists()  

        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table("AIChatHistory")

        
        response = table.query(
            KeyConditionExpression=Key("RoomID").eq(f"AI_{user_id}"),
            ScanIndexForward=True,
        )
        return response.get("Items", [])
    except Exception as e:
        print(f"[DYNAMO HISTORY ERROR - FETCH] {e}")
        return []
