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

        headers = dict(self.scope.get('headers', []))
        subprotocol = None
        if b'sec-websocket-protocol' in headers:
            subprotocol = headers[b'sec-websocket-protocol'].decode('utf-8').split(',')[0].strip()

        await self.accept(subprotocol=subprotocol)

        history = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': history
        }, cls=DecimalEncoder))

    async def disconnect(self, close_code):
        # Notify others that call ended if active
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'call_ended',
                'sender_id': self.user_id
            }
        )
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', 'chat_message') # Default to chat
        timestamp = datetime.now().isoformat()

        # --- WEBRTC SIGNALING (Do not save to DB) ---
        if msg_type in ['call_user', 'answer_call', 'ice_candidate', 'call_ended']:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'webrtc_signal',
                    'signal_type': msg_type,
                    'data': data.get('data'),
                    'sender_id': self.user_id
                }
            )
            return

        # --- NORMAL CHAT (Save to DB) ---
        message_text = data.get('message', '')
        file_url = data.get('file_url', None)
        file_type = data.get('file_type', 'text')

        # Save message to ChatHistory
        await self.save_message_to_dynamo(self.user_id, message_text, file_url, file_type, timestamp)
        
        # Update consultation tracking
        await self.update_consultation(self.user_id, message_text, timestamp)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'file_url': file_url,
                'file_type': file_type,
                'sender_id': self.user_id,
                'timestamp': timestamp
            }
        )

    # Handler for Normal Chat
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
            'file_url': event.get('file_url'),
            'file_type': event.get('file_type'),
            'sender_id': event['sender_id'],
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }, cls=DecimalEncoder))

    # Handler for WebRTC Signaling
    async def webrtc_signal(self, event):
        # Don't send the signal back to the sender
        if str(event['sender_id']) != str(self.user_id):
            await self.send(text_data=json.dumps({
                'type': event['signal_type'],
                'data': event.get('data'),
                'sender_id': event['sender_id']
            }))

    # ... (Keep save_message_to_dynamo, update_consultation, cleanup_old_messages, get_chat_history exactly as they were) ...
    # Copy/Paste your existing DB methods here.
    @database_sync_to_async
    def save_message_to_dynamo(self, sender_id, message, file_url=None, file_type='text', timestamp=None):
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            
            table.put_item(
                Item={
                    'RoomID': self.room_name,
                    'Timestamp': timestamp or datetime.now().isoformat(),
                    'SenderID': int(sender_id),
                    'Message': message,
                    'FileUrl': file_url,
                    'FileType': file_type
                }
            )
            self.cleanup_old_messages(table)
        except Exception as e:
            print(f"DYNAMODB SAVE ERROR: {e}")

    @database_sync_to_async
    def update_consultation(self, sender_id, message, timestamp):
        try:
            dynamodb = get_dynamodb_resource()
            consultations_table = dynamodb.Table('DoctorConsultations')
            parts = self.room_name.split('_')
            patient_id = int(parts[1])
            doctor_id = int(parts[3])
            
            response = consultations_table.get_item(Key={'ConsultationID': self.room_name})
            existing = response.get('Item')
            
            if existing:
                consultations_table.update_item(
                    Key={'ConsultationID': self.room_name},
                    UpdateExpression='SET LastMessage = :msg, LastMessageTime = :time, LastSenderID = :sender',
                    ExpressionAttributeValues={':msg': message, ':time': timestamp, ':sender': int(sender_id)}
                )
            else:
                consultations_table.put_item(
                    Item={
                        'ConsultationID': self.room_name,
                        'DoctorID': doctor_id,
                        'PatientID': patient_id,
                        'Status': 'active',
                        'LastMessage': message,
                        'LastMessageTime': timestamp,
                        'LastSenderID': int(sender_id),
                        'CreatedAt': timestamp
                    }
                )
        except Exception as e:
            print(f"CONSULTATION UPDATE ERROR: {e}")

    def cleanup_old_messages(self, table):
        try:
            response = table.query(
                KeyConditionExpression="RoomID = :rid",
                ExpressionAttributeValues={":rid": self.room_name},
                ScanIndexForward=True
            )
            messages = response.get('Items', [])
            CAPACITY = 100
            if len(messages) > CAPACITY:
                messages_to_delete = messages[:len(messages) - CAPACITY]
                with table.batch_writer() as batch:
                    for msg in messages_to_delete:
                        batch.delete_item(Key={'RoomID': msg['RoomID'], 'Timestamp': msg['Timestamp']})
        except Exception as e:
            print(f"CLEANUP ERROR: {e}")

    @database_sync_to_async
    def get_chat_history(self):
        try:
            dynamodb = get_dynamodb_resource()
            table = dynamodb.Table('ChatHistory')
            all_messages = []
            last_evaluated_key = None
            while True:
                if last_evaluated_key:
                    response = table.query(
                        KeyConditionExpression="RoomID = :rid",
                        ExpressionAttributeValues={":rid": self.room_name},
                        ScanIndexForward=True,
                        ExclusiveStartKey=last_evaluated_key
                    )
                else:
                    response = table.query(
                        KeyConditionExpression="RoomID = :rid",
                        ExpressionAttributeValues={":rid": self.room_name},
                        ScanIndexForward=True
                    )
                all_messages.extend(response.get('Items', []))
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
            return all_messages
        except Exception as e:
            print(f"DYNAMODB HISTORY ERROR: {e}")
            return []