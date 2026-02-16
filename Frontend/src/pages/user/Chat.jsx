import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend, IoMdClose, IoMdPlay, IoMdMic, IoMdSquare, IoMdTrash } from 'react-icons/io'; // Removed IoMdStop
import { RiImageAddLine } from 'react-icons/ri';
import api from '../../lib/axios';
import { useUpload } from '../../context/UploadContext';
import CustomAudioPlayer from '../../components/CustomAudioPlayer';

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken } = useSelector((state) => state.auth);
  const doctor = location.state?.doctor;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Persistent Uploads
  const { roomUploads, uploadFile, removeUpload } = useUpload();
  const roomId = doctor ? `user_${user.id}_doc_${doctor.id}` : null;
  const pendingMessages = roomId ? (roomUploads[roomId] || []) : [];
  
  // Merge backend messages with local pending uploads
  const displayMessages = [...messages, ...pendingMessages];

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Viewer
  const [selectedMedia, setSelectedMedia] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { if (!doctor) navigate('/consult'); }, [doctor, navigate]);

  // WebSocket
  useEffect(() => {
    if (!roomId || !accessToken) return;
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_history') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages((prev) => [...prev, data]);
          
          // Remove pending message from Context if it exists
          if (String(data.sender_id) === String(user.id)) {
             const pending = roomUploads[roomId] || [];
             if (pending.length > 0) {
                 removeUpload(roomId, pending[0].tempId);
             }
          }
        }
      } catch (e) { console.error("WebSocket error:", e); }
    };

    socketRef.current = ws;
    return () => { if (socketRef.current) socketRef.current.close(); };
  }, [roomId, accessToken, roomUploads]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [displayMessages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({ message: inputText, sender_id: user.id }));
    setInputText('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file, roomId, null, user.id);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- AUDIO RECORDING LOGIC ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { 
          if(e.data.size > 0) audioChunksRef.current.push(e.data); 
      };
      
      // We define the onstop behavior here, but we will trigger it manually
      mediaRecorder.onstop = () => {
        // This is handled in sendRecording now
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) { alert("Microphone access denied."); }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
      setIsRecording(false);
      clearInterval(timerRef.current);
      audioChunksRef.current = [];
  };

  const sendRecording = () => {
      if (!mediaRecorderRef.current) return;
      
      // Stop the recorder
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);

      // Wait a tiny bit for the last data chunk
      setTimeout(() => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          uploadFile(audioFile, roomId, 'audio', user.id);
      }, 200);
  };

  if (!doctor) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button onClick={() => navigate('/consult')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
          {doctor.profile_image ? <img src={doctor.profile_image} className="w-full h-full object-cover" /> : doctor.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 truncate">Dr. {doctor.first_name || doctor.username}</h3>
          <p className="text-xs text-green-600 font-medium">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayMessages.map((msg, index) => {
          const isMe = Number(msg.SenderID || msg.sender_id) === Number(user.id);
          const fileType = msg.FileType || msg.file_type;
          const fileUrl = msg.FileUrl || msg.file_url;
          const isUploading = msg.isUploading;
          
          return (
            <div key={msg.tempId || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 self-end mb-1">{doctor.username?.charAt(0).toUpperCase()}</div>}
              
              <div className={`relative max-w-[75%] rounded-2xl p-1 shadow-sm ${isMe ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                
                {/* Media Content */}
                <div className="relative rounded-xl overflow-hidden">
                    {fileType === 'image' && (
                        <img 
                            src={fileUrl} 
                            className={`max-h-64 w-full object-cover cursor-pointer ${isUploading ? 'opacity-75' : ''}`} 
                            onClick={() => !isUploading && setSelectedMedia({ url: fileUrl, type: 'image' })} 
                        />
                    )}
                    
                    {fileType === 'video' && (
                        <div className="relative cursor-pointer bg-black" onClick={() => !isUploading && setSelectedMedia({ url: fileUrl, type: 'video' })}>
                            <video src={fileUrl} className={`max-h-64 w-full object-contain ${isUploading ? 'opacity-75' : ''}`} preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center"><IoMdPlay className="text-white text-4xl opacity-90" /></div>
                        </div>
                    )}

                    {fileType === 'audio' && (
                        <div className="p-1">
                            <CustomAudioPlayer src={fileUrl} isMe={isMe} />
                        </div>
                    )}

                    {/* Subtle Loading Spinner (Bottom Right) */}
                    {isUploading && (
                        <div className="absolute bottom-2 right-2 flex items-center justify-center bg-black/60 rounded-full w-8 h-8 p-1 backdrop-blur-md shadow-md z-20">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Text Message (Only if valid string) */}
                {msg.message && msg.message.trim() !== "" && (
                  <p className="text-sm px-3 py-2 leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                )}
                
                {/* Timestamp */}
                <div className={`text-[10px] text-right px-2 pb-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.Timestamp || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          
          {/* Recording UI */}
          {isRecording ? (
              <div className="flex-1 bg-gray-50 rounded-full flex items-center px-2 py-1.5 border border-red-200 animate-pulse-soft transition-all">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full mr-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-red-600 font-mono font-medium flex-1">{formatTime(recordingTime)}</span>
                  
                  {/* Cancel Button */}
                  <button onClick={cancelRecording} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1">
                    <IoMdTrash className="text-xl" />
                  </button>
                  
                  {/* Send Audio Button */}
                  <button onClick={sendRecording} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-md active:scale-95">
                      <IoMdSend className="text-lg" />
                  </button>
              </div>
          ) : (
              // Normal Input UI
              <>
                <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95">
                    <RiImageAddLine className="text-xl" />
                </button>
                <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,audio/*" onChange={handleFileSelect} />
                
                <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <input 
                        type="text" 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                        placeholder="Type a message..." 
                        className="bg-transparent flex-1 outline-none text-sm text-gray-800 placeholder-gray-400" 
                    />
                </div>

                {inputText.trim() ? (
                    <button onClick={handleSendMessage} className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95">
                        <IoMdSend className="text-xl" />
                    </button>
                ) : (
                    <button onClick={startRecording} className="w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 hover:text-blue-600">
                        <IoMdMic className="text-xl" />
                    </button>
                )}
              </>
          )}
        </div>
      </div>

      {/* Full Screen Media Viewer */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50">
            <IoMdClose className="text-2xl" />
          </button>
          <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && setSelectedMedia(null)}>
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl outline-none" />
            ) : (
              <img src={selectedMedia.url} alt="Full screen" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes pulse-soft { 0%, 100% { border-color: #fecaca; } 50% { border-color: #f87171; } }
        .animate-pulse-soft { animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
};

export default Chat;