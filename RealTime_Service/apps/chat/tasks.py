import cloudinary.uploader
import os
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .services import get_dynamodb_resource
from datetime import datetime

@shared_task
def process_file_upload(file_path, room_name, user_id, original_filename):
    try:
        
        
        resource_type = "auto"
        if file_path.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
            resource_type = "video"

        print(f"🔄 Celery: Starting upload for {original_filename}...")
        
        upload_data = cloudinary.uploader.upload(
            file_path, 
            resource_type=resource_type,
            folder="chat_media"
        )
        
        secure_url = upload_data.get("secure_url")
        actual_resource_type = upload_data.get("resource_type")
        
        
        if os.path.exists(file_path):
            os.remove(file_path)

        
        timestamp = datetime.now().isoformat()
        dynamodb = get_dynamodb_resource()
        
        
        history_table = dynamodb.Table('ChatHistory')
        history_table.put_item(
            Item={
                'RoomID': room_name,
                'Timestamp': timestamp,
                'SenderID': int(user_id),
                'Message': f"Sent a {actual_resource_type}",
                'FileUrl': secure_url,
                'FileType': actual_resource_type
            }
        )

        
        consultations_table = dynamodb.Table('DoctorConsultations')
        
        

        
        channel_layer = get_channel_layer()
        group_name = f'chat_{room_name}'
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'chat_message',
                'message': f"Sent a {actual_resource_type}",
                'file_url': secure_url,
                'file_type': actual_resource_type,
                'sender_id': user_id,
                'timestamp': timestamp
            }
        )
        
        print(f"✅ Celery: Upload complete for {original_filename}")
        return secure_url

    except Exception as e:
        print(f"❌ Celery Error: {e}")
        
        if os.path.exists(file_path):
            os.remove(file_path)
        return None
