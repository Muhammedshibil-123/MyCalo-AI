import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend, IoMdCheckmarkCircle, IoMdClose, IoMdPlay } from 'react-icons/io';
import { RiImageAddLine } from 'react-icons/ri';
import api from '../../lib/axios';

const DoctorChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, accessToken } = useSelector((state) => state.auth);
  const patient = location.state?.patient;
  const initialStatus = location.state?.status || 'active';
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isResolved, setIsResolved] = useState(initialStatus === 'resolved');
  
  // State for Full Screen Media Viewer
  const [selectedMedia, setSelectedMedia] = useState(null); // { url: string, type: 'image' | 'video' }

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // WebSocket Connection
  useEffect(() => {
    if (!roomId || !accessToken || isResolved) return;

    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onopen = () => console.log("✅ Connected to room:", roomId);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_history') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages((prev) => {
            const exists = prev.some(msg => 
              (msg.Timestamp || msg.timestamp) === data.timestamp && 
              (msg.SenderID || msg.sender_id) === data.sender_id
            );
            return exists ? prev : [...prev, data];
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    socketRef.current = ws;
    return () => { if (ws.readyState === 1) ws.close(); };
  }, [roomId, accessToken, isResolved]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current || isResolved) return;
    socketRef.current.send(JSON.stringify({ message: inputText, sender_id: user.id }));
    setInputText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isResolved) return;

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
          file_type: resource_type, // 'image' or 'video'
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

  const handleResolve = async () => {
    if (!window.confirm('Mark this consultation as resolved?')) return;
    setIsResolving(true);
    try {
      await api.post(`/chat/resolve/${roomId}/`);
      setIsResolved(true);
      if (socketRef.current) socketRef.current.close();
      setTimeout(() => navigate('/doctor/consult'), 1500);
    } catch (error) {
      alert("Failed to resolve consultation.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* --- Header --- */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-10 flex items-center gap-3">
        <button onClick={() => navigate('/doctor/consult')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">
          {(patient?.first_name || patient?.username || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg text-gray-900 truncate">
            {patient?.first_name || patient?.username || "Patient"}
          </div>
          <div className="text-xs font-medium">
            {isResolved ? <span className="text-green-600 flex items-center gap-1"><IoMdCheckmarkCircle /> Resolved</span> : <span className="text-blue-600">Active Consultation</span>}
          </div>
        </div>
        {!isResolved && (
          <button onClick={handleResolve} disabled={isResolving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-md">
            {isResolving ? "..." : <> <IoMdCheckmarkCircle className="text-lg" /> Resolve </>}
          </button>
        )}
      </div>

      {/* --- Messages Area --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((msg, i) => {
          const isMe = Number(msg.SenderID || msg.sender_id) === Number(user.id);
          const fileType = msg.FileType || msg.file_type;
          const fileUrl = msg.FileUrl || msg.file_url;
          
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold mr-2 self-end mb-1">{(patient?.username || "P")[0].toUpperCase()}</div>}
              
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                
                {/* Image Rendering */}
                {fileType === 'image' && (
                  <div className="relative group cursor-pointer" onClick={() => setSelectedMedia({ url: fileUrl, type: 'image' })}>
                    <img src={fileUrl} alt="shared" className="rounded-lg mb-2 w-full max-w-xs object-cover bg-black/10 min-h-[150px]" />
                  </div>
                )}
                
                {/* Video Rendering */}
                {fileType === 'video' && (
                  <div className="relative group cursor-pointer" onClick={() => setSelectedMedia({ url: fileUrl, type: 'video' })}>
                    <div className="relative rounded-lg overflow-hidden bg-black mb-2 w-full max-w-xs">
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
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.Message || msg.message}</p>
                )}
                <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.Timestamp || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        {!isResolved ? (
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
              {isUploading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <RiImageAddLine className="text-xl" />}
            </button>
            <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400" placeholder="Type your advice..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
            </div>
            <button onClick={sendMessage} disabled={!inputText.trim()} className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all shadow-md">
              <IoMdSend className="text-xl" />
            </button>
          </div>
        ) : (
          <div className="text-center py-3 text-gray-500 text-sm font-medium">This consultation is resolved.</div>
        )}
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

export default DoctorChatPage;