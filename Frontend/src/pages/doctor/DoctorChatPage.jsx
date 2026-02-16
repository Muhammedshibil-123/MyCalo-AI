import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend } from 'react-icons/io';
import { RiImageAddLine } from 'react-icons/ri';
import api from '../../lib/axios';

const DoctorChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, accessToken } = useSelector((state) => state.auth);
  const patient = location.state?.patient;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // WebSocket Connection with duplicate message prevention
  useEffect(() => {
    if (!roomId || !accessToken) return;

    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onopen = () => {
      console.log("✅ Connected to room:", roomId);
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
          
          // FIXED: Prevent duplicate messages
          setMessages((prev) => {
            // Check if message already exists by timestamp and sender
            const exists = prev.some(msg => {
              const msgTime = msg.Timestamp || msg.timestamp;
              const msgSender = msg.SenderID || msg.sender_id;
              return msgTime === data.timestamp && msgSender === data.sender_id;
            });
            
            if (exists) {
              console.log('⚠️ Duplicate message prevented');
              return prev;
            }
            
            return [...prev, data];
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
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
      if (ws.readyState === 1) ws.close();
    };
  }, [roomId, accessToken]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
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
      
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          message: resource_type === 'video' ? 'Sent a video' : 'Sent an image',
          file_url: url,
          file_type: resource_type,
          sender_id: user.id
        }));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button 
          onClick={() => navigate('/doctor/consult')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
        >
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden flex-shrink-0 border border-blue-200">
          {(patient?.first_name || patient?.username || "?")[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg text-gray-900 truncate">
            {patient?.first_name ? `${patient.first_name}` : patient?.username || "Patient"}
          </div>
          <div className="text-xs text-green-600 font-medium">Online Consultation</div>
        </div>
        
        <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-100">
          Medical Consult
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-gray-400 font-medium">No messages yet. Start the consultation.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const msgSenderId = msg.SenderID || msg.sender_id;
            const isMe = Number(msgSenderId) === Number(user.id);
            
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold mr-2 flex-shrink-0 self-end mb-1">
                    {(patient?.username || "P")[0].toUpperCase()}
                  </div>
                )}
                
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                  {(msg.FileType === 'image' || msg.file_type === 'image') && (
                    <img 
                      src={msg.FileUrl || msg.file_url} 
                      alt="shared" 
                      className="rounded-lg mb-2 w-full max-w-xs cursor-pointer hover:opacity-95 transition-opacity bg-black/5"
                      onClick={() => window.open(msg.FileUrl || msg.file_url, '_blank')}
                    />
                  )}
                  
                  {(msg.FileType === 'video' || msg.file_type === 'video') && (
                    <video controls className="rounded-lg mb-2 w-full max-w-xs bg-black">
                      <source src={msg.FileUrl || msg.file_url} />
                    </video>
                  )}

                  {(msg.Message || msg.message) && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {msg.Message || msg.message}
                    </p>
                  )}
                  
                  <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.Timestamp || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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

          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input 
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              placeholder="Type your advice..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
          </div>
          
          <button 
            onClick={sendMessage} 
            disabled={!inputText.trim()}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md"
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

export default DoctorChatPage;