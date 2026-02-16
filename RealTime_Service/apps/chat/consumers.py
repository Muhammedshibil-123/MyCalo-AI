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

        # Redis is used HERE by Channels for group management
        # channel_layer (Redis) handles group_add, group_send, group_discard
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Fix WebSocket protocol negotiation
        headers = dict(self.scope.get('headers', []))
        subprotocol = None
        if b'sec-websocket-protocol' in headers:
            subprotocol = headers[b'sec-websocket-protocol'].decode('utf-8').split(',')[0].strip()

        await self.accept(subprotocol=subprotocol)

        # Load ALL chat history (unlimited with pagination)
        history = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': history
        }, cls=DecimalEncoder))

    async def disconnect(self, close_code):
        # Redis handles group removal
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get('message', '')
        file_url = data.get('file_url', None)
        file_type = data.get('file_type', 'text')

        # Save message and auto-cleanup if needed
        await self.save_message_to_dynamo(self.user_id, message_text, file_url, file_type)

        # Redis broadcasts this to all connected clients in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'file_url': file_url,
                'file_type': file_type,
                'sender_id': self.user_id,
                'timestamp': datetime.now().isoformat()
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket (called by Redis channel layer)
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
            'file_url': event.get('file_url'),
            'file_type': event.get('file_type'),
            'sender_id': event['sender_id'],
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }, cls=DecimalEncoder))

    @database_sync_to_async
    def save_message_to_dynamo(self, sender_id, message, file_url=None, file_type='text'):
        """
        Save message to DynamoDB and auto-cleanup if capacity exceeds 100
        """
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            
            # Save new message
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
            
            # Check message count and cleanup if needed
            self.cleanup_old_messages(table)
            
        except Exception as e:
            print(f"DYNAMODB SAVE ERROR: {e}")

    def cleanup_old_messages(self, table):
        """
        Keep only the latest 100 messages per room.
        Delete oldest messages when count exceeds 100.
        
        This ensures:
        - Chat never gets stuck
        - Storage stays efficient
        - Oldest messages auto-delete
        """
        try:
            # Get all messages for this room
            response = table.query(
                KeyConditionExpression="RoomID = :rid",
                ExpressionAttributeValues={":rid": self.room_name},
                ScanIndexForward=True  # Oldest first
            )
            
            messages = response.get('Items', [])
            
            # If more than 100 messages, delete the oldest ones
            CAPACITY = 100
            if len(messages) > CAPACITY:
                messages_to_delete = messages[:len(messages) - CAPACITY]
                
                print(f"🗑️ Cleaning up {len(messages_to_delete)} old messages from {self.room_name}")
                
                # Delete old messages in batch
                with table.batch_writer() as batch:
                    for msg in messages_to_delete:
                        batch.delete_item(
                            Key={
                                'RoomID': msg['RoomID'],
                                'Timestamp': msg['Timestamp']
                            }
                        )
                    
        except Exception as e:
            print(f"CLEANUP ERROR: {e}")

    @database_sync_to_async
    def get_chat_history(self):
        """
        Fetch ALL chat history with pagination support.
        No limit - loads everything using DynamoDB pagination.
        
        Returns: List of all messages (up to current capacity of 100 after cleanup)
        """
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            
            all_messages = []
            last_evaluated_key = None
            
            # Paginate through ALL messages (DynamoDB returns max 1MB per call)
            while True:
                if last_evaluated_key:
                    response = table.query(
                        KeyConditionExpression="RoomID = :rid",
                        ExpressionAttributeValues={":rid": self.room_name},
                        ScanIndexForward=True,  # Oldest first
                        ExclusiveStartKey=last_evaluated_key
                    )
                else:
                    response = table.query(
                        KeyConditionExpression="RoomID = :rid",
                        ExpressionAttributeValues={":rid": self.room_name},
                        ScanIndexForward=True  # Oldest first
                    )
                
                all_messages.extend(response.get('Items', []))
                
                # Check if there are more pages
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
            
            print(f"📜 Loaded {len(all_messages)} messages for {self.room_name}")
            return all_messages
            
        except Exception as e:
            print(f"DYNAMODB HISTORY ERROR: {e}")
            return []