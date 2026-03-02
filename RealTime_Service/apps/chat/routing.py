from django.urls import re_path
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>user_\d+_doc_\d+)/$', consumers.ChatConsumer.as_asgi()),
]