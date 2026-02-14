import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend } from 'react-icons/io';
import { RiImageAddLine } from 'react-icons/ri';
import api from '../../lib/axios';

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken } = useSelector((state) => state.auth);
  
  const doctor = location.state?.doctor;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Redirect if no doctor selected
  useEffect(() => {
    if (!doctor) {
      navigate('/consult');
    }
  }, [doctor, navigate]);

  // WebSocket Connection
  useEffect(() => {
    if (!doctor || !user?.id) return;

    const roomId = `user_${user.id}_doc_${doctor.id}`;
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    
    // Pass token as subprotocol for browser compatibility
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onopen = () => {
      console.log('✅ Connected to chat room:', roomId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        
        if (data.type === 'chat_history') {
          console.log('📜 Chat history loaded:', data.messages);
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          console.log('💬 New message:', data);
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("WebSocket parse error:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from chat');
    };

    socketRef.current = ws;

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [doctor, user, accessToken]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    
    socketRef.current.send(JSON.stringify({ 
      message: inputText, 
      sender_id: user.id 
    }));
    setInputText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/chat/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { url, resource_type } = response.data;
      
      socketRef.current.send(JSON.stringify({
        message: resource_type === 'video' ? 'Sent a video' : 'Sent an image',
        file_url: url,
        file_type: resource_type,
        sender_id: user.id
      }));

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!doctor) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button 
          onClick={() => navigate('/consult')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
        >
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
          {doctor.profile_image ? (
            <img src={doctor.profile_image} alt={doctor.username} className="w-full h-full object-cover" />
          ) : (
            doctor.username?.charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">
            Dr. {doctor.first_name || doctor.username}
          </h3>
          <p className="text-xs text-green-600 font-medium">● Active now</p>
        </div>

        {/* Call Icons */}
        <div className="flex gap-3 text-gray-600">
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Start the Conversation</h3>
            <p className="text-sm text-gray-500">Send a message to Dr. {doctor.first_name || doctor.username}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            // Check if message is from current user
            // Backend sends: SenderID (capitalized) or sender_id
            const senderId = msg.SenderID || msg.sender_id;
            const isMe = senderId === user.id;
            
            console.log('Message:', { senderId, userId: user.id, isMe, msg }); // Debug log
            
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">
                    {doctor.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMe 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                  
                  {/* Media Content */}
                  {(msg.FileType === 'image' || msg.file_type === 'image') && (
                    <img 
                      src={msg.FileUrl || msg.file_url} 
                      alt="shared" 
                      className="rounded-xl mb-2 w-full max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.FileUrl || msg.file_url, '_blank')}
                    />
                  )}
                  
                  {(msg.FileType === 'video' || msg.file_type === 'video') && (
                    <video controls className="rounded-xl mb-2 w-full max-w-xs">
                      <source src={msg.FileUrl || msg.file_url} />
                    </video>
                  )}

                  {/* Text Content */}
                  {(msg.Message || msg.message) && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.Message || msg.message}
                    </p>
                  )}
                  
                  {/* Timestamp */}
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.Timestamp || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RiImageAddLine className="text-xl" />
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            hidden 
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />

          {/* Text Input */}
          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2.5 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="bg-transparent flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <IoMdSend className="text-xl" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Chat;