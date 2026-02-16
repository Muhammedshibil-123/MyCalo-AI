import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend, IoMdClose, IoMdPlay } from 'react-icons/io';
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
  
  // State for Full Screen Media Viewer
  const [selectedMedia, setSelectedMedia] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { if (!doctor) navigate('/consult'); }, [doctor, navigate]);

  // WebSocket
  useEffect(() => {
    if (!doctor || !user?.id) return;
    const roomId = `user_${user.id}_doc_${doctor.id}`;
    const ws = new WebSocket(`ws://localhost:8080/ws/chat/${roomId}/`, [accessToken]);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_history') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) { console.error("WebSocket error:", e); }
    };

    socketRef.current = ws;
    return () => { if (socketRef.current) socketRef.current.close(); };
  }, [doctor, user, accessToken]);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({ message: inputText, sender_id: user.id }));
    setInputText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/chat/upload/', formData);
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
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!doctor) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* --- Header --- */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/consult')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
          {doctor.profile_image ? <img src={doctor.profile_image} alt={doctor.username} className="w-full h-full object-cover" /> : doctor.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">Dr. {doctor.first_name || doctor.username}</h3>
          <p className="text-xs text-green-600 font-medium">● Active now</p>
        </div>
      </div>

      {/* --- Messages Area --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((msg, index) => {
          const isMe = Number(msg.SenderID || msg.sender_id) === Number(user.id);
          const fileType = msg.FileType || msg.file_type;
          const fileUrl = msg.FileUrl || msg.file_url;
          
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 self-end">{doctor.username?.charAt(0).toUpperCase()}</div>}
              
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                
                {/* Image Rendering */}
                {fileType === 'image' && (
                  <div className="relative group cursor-pointer" onClick={() => setSelectedMedia({ url: fileUrl, type: 'image' })}>
                    <img src={fileUrl} alt="shared" className="rounded-xl mb-2 w-full max-w-xs object-cover bg-black/10 min-h-[150px]" />
                  </div>
                )}
                
                {/* Video Rendering */}
                {fileType === 'video' && (
                  <div className="relative group cursor-pointer" onClick={() => setSelectedMedia({ url: fileUrl, type: 'video' })}>
                    <div className="relative rounded-xl overflow-hidden bg-black mb-2 w-full max-w-xs border border-white/20">
                      <video src={fileUrl} className="w-full h-full max-h-[250px] object-contain opacity-80 group-hover:opacity-60 transition-opacity" preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <IoMdPlay className="text-white text-2xl ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(msg.Message || msg.message) && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.Message || msg.message}</p>
                )}
                <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(msg.Timestamp || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            {isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <RiImageAddLine className="text-xl" />}
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2.5 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="bg-transparent flex-1 outline-none text-sm text-gray-800 placeholder-gray-400" />
          </div>
          <button onClick={handleSendMessage} disabled={!inputText.trim()} className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            <IoMdSend className="text-xl" />
          </button>
        </div>
      </div>

      {/* --- Full Screen Media Viewer Modal --- */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <button 
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
          >
            <IoMdClose className="text-2xl" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && setSelectedMedia(null)}>
            {selectedMedia.type === 'video' ? (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-full rounded-lg shadow-2xl outline-none"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt="Full screen" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              />
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Chat;