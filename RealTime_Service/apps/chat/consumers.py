import json
import decimal
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime
from channels.db import database_sync_to_async
from .services import get_dynamodb_resource

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

        # --- FIX STARTS HERE ---
        # We must echo back the subprotocol (token) to satisfy the browser/client
        headers = dict(self.scope.get('headers', []))
        subprotocol = None
        if b'sec-websocket-protocol' in headers:
            # Extract the token exactly as the middleware did
            subprotocol = headers[b'sec-websocket-protocol'].decode('utf-8').split(',')[0].strip()

        # Accept the connection AND the protocol
        await self.accept(subprotocol=subprotocol)
        # --- FIX ENDS HERE ---

        history = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': history
        }, cls=DecimalEncoder))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get('message', '')
        file_url = data.get('file_url', None)
        file_type = data.get('file_type', 'text')

        await self.save_message_to_dynamo(self.user_id, message_text, file_url, file_type)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'file_url': file_url,
                'file_type': file_type,
                'sender_id': self.user_id
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
            'file_url': event.get('file_url'),
            'file_type': event.get('file_type'),
            'sender_id': event['sender_id'],
            'timestamp': datetime.now().isoformat()
        }, cls=DecimalEncoder))

    @database_sync_to_async
    def save_message_to_dynamo(self, sender_id, message, file_url=None, file_type='text'):
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            table.put_item(
                Item={
                    'RoomID': self.room_name,
                    'Timestamp': datetime.now().isoformat(),
                    'SenderID': int(sender_id),
                    'Message': message,
                    'FileUrl': file_url,
                    'FileType': file_type
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