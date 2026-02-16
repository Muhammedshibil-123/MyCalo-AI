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
        lower_path = file_path.lower()
        
        
        if lower_path.endswith(('.mp3', '.wav', '.ogg', '.m4a', '.webm')):
             resource_type = "video" 
        elif lower_path.endswith(('.mp4', '.mov', '.avi', '.mkv')):
             resource_type = "video"

        print(f"🔄 Celery: Starting upload for {original_filename}...")
        
        
        upload_data = cloudinary.uploader.upload(
            file_path, 
            resource_type=resource_type,
            folder="chat_media"
        )
        
        secure_url = upload_data.get("secure_url")
        actual_resource_type = upload_data.get("resource_type")
        
        
        
        file_format = upload_data.get("format", "")
        frontend_file_type = actual_resource_type
        if file_format in ['mp3', 'wav', 'ogg', 'webm', 'm4a'] or 'audio' in original_filename:
            frontend_file_type = 'audio'

        
        if os.path.exists(file_path):
            os.remove(file_path)

        
        timestamp = datetime.now().isoformat()
        dynamodb = get_dynamodb_resource()
        
        
        chat_message_text = ""
        
        
        dashboard_text = f"Sent {('an ' + frontend_file_type) if frontend_file_type == 'image' else ('a ' + frontend_file_type)}"

        
        history_table = dynamodb.Table('ChatHistory')
        history_table.put_item(
            Item={
                'RoomID': room_name,
                'Timestamp': timestamp,
                'SenderID': int(user_id),
                'Message': chat_message_text, 
                'FileUrl': secure_url,
                'FileType': frontend_file_type 
            }
        )

        
        try:
            consultations_table = dynamodb.Table('DoctorConsultations')
            
            
            
            
            pass 
        except Exception as e:
            print(f"Error updating consultation status: {e}")

        
        channel_layer = get_channel_layer()
        group_name = f'chat_{room_name}'
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'chat_message',
                'message': chat_message_text,
                'file_url': secure_url,
                'file_type': frontend_file_type,
                'sender_id': user_id,
                'timestamp': timestamp
            }
        )
        
        print(f"✅ Celery: Upload complete. Type: {frontend_file_type}")
        return secure_url

    except Exception as e:
        print(f"❌ Celery Error: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        return None
