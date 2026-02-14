import json
import decimal
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime
from channels.db import database_sync_to_async
from .services import get_dynamodb_resource

# --- HELPER: Handles DynamoDB Decimals for JSON ---
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user_id = self.scope.get("user_id")

        if self.user_id is None:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Load history and use the custom DecimalEncoder
        history = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': history
        }, cls=DecimalEncoder))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')

        await self.save_message_to_dynamo(self.user_id, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': self.user_id
            }
        )

    async def chat_message(self, event):
        # Broadcasted messages use the custom DecimalEncoder
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'timestamp': datetime.now().isoformat()
        }, cls=DecimalEncoder))

    # --- Sync to Async Helpers ---

    @database_sync_to_async
    def save_message_to_dynamo(self, sender_id, message):
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            table.put_item(
                Item={
                    'RoomID': self.room_name,
                    'Timestamp': datetime.now().isoformat(),
                    'SenderID': int(sender_id),
                    'Message': message
                }
            )
        except Exception as e:
            print(f"DYNAMODB SAVE ERROR: {e}")

    @database_sync_to_async
    def get_chat_history(self):
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            response = table.query(
                KeyConditionExpression="RoomID = :rid",
                ExpressionAttributeValues={":rid": self.room_name},
                Limit=20,
                ScanIndexForward=True
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"DYNAMODB HISTORY ERROR: {e}")
            return []