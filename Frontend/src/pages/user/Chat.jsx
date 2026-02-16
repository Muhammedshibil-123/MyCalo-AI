import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend, IoMdClose, IoMdPlay, IoMdMic, IoMdSquare, IoMdTrash, IoMdVideocam, IoMdCall } from 'react-icons/io';
import { RiImageAddLine } from 'react-icons/ri';
import api from '../../lib/axios';
import { useUpload } from '../../context/UploadContext';
import CustomAudioPlayer from '../../components/CustomAudioPlayer';
import VideoCall from '../../components/VideoCall';

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken } = useSelector((state) => state.auth);
  const doctor = location.state?.doctor;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);

  const { roomUploads, uploadFile, removeUpload } = useUpload();
  const roomId = doctor ? `user_${user.id}_doc_${doctor.id}` : null;
  
  const pendingMessages = roomId ? (roomUploads[roomId] || []) : [];
  
  const displayMessages = [...messages, ...pendingMessages].sort((a, b) => {
      const t1 = new Date(a.Timestamp || a.timestamp || 0).getTime();
      const t2 = new Date(b.Timestamp || b.timestamp || 0).getTime();
      return t1 - t2;
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { if (!doctor) navigate('/consult'); }, [doctor, navigate]);

  useEffect(() => {
    if (!roomId || !accessToken) return;
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'call_user') {
            setIsReceivingCall(true);
            setIncomingCallData(data.data);
        }
        else if (data.type === 'call_ended') {
            setIsReceivingCall(false);
            setShowVideoCall(false);
            setIncomingCallData(null);
        }
        else if (data.type === 'chat_history') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages((prev) => {
            const exists = prev.some(m => 
                (m.Timestamp || m.timestamp) === data.timestamp && 
                String(m.SenderID || m.sender_id) === String(data.sender_id)
            );
            if (exists) return prev;
            return [...prev, data];
          });
          
          if (String(data.sender_id) === String(user.id) && data.file_url) {
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
    
    const payload = { 
        message: inputText, 
        sender_id: user.id 
    };
    
    socketRef.current.send(JSON.stringify(payload));
    setInputText('');
  };

  const startCall = () => {
      setIsInitiator(true);
      setShowVideoCall(true);
  };

  const answerCall = () => {
      setIsInitiator(false);
      setShowVideoCall(true);
      setIsReceivingCall(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file, roomId, null, user.id);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);

      setTimeout(() => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          uploadFile(audioFile, roomId, 'audio', user.id);
      }, 200);
  };

  if (!doctor) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
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
        
        <button onClick={startCall} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
            <IoMdVideocam className="text-xl" />
        </button>
      </div>

      {isReceivingCall && !showVideoCall && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-bounce">
              <div className="flex flex-col">
                  <span className="font-bold text-lg">Incoming Video Call...</span>
                  <span className="text-sm text-gray-300">Dr. {doctor.username} is calling</span>
              </div>
              <button onClick={answerCall} className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors animate-pulse">
                  <IoMdCall className="text-xl" />
              </button>
              <button onClick={() => setIsReceivingCall(false)} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors">
                  <IoMdClose className="text-xl" />
              </button>
          </div>
      )}

      {showVideoCall && (
          <VideoCall 
            socket={socketRef} 
            user={user} 
            roomId={roomId} 
            isInitiator={isInitiator}
            signalData={incomingCallData}
            onClose={() => {
                setShowVideoCall(false);
                setIsReceivingCall(false);
            }} 
          />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayMessages.map((msg, index) => {
          const senderId = msg.SenderID || msg.sender_id;
          const timestamp = msg.Timestamp || msg.timestamp;
          const messageText = msg.Message || msg.message;
          const fileType = msg.FileType || msg.file_type;
          const fileUrl = msg.FileUrl || msg.file_url;
          
          const isMe = Number(senderId) === Number(user.id);
          const isUploading = msg.isUploading;
          
          return (
            <div key={msg.tempId || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 self-end mb-1">{doctor.username?.charAt(0).toUpperCase()}</div>}
              
              <div className={`relative max-w-[75%] rounded-2xl p-1 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                
                {fileUrl && (
                    <div className="relative rounded-xl overflow-hidden mb-1">
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

                        {isUploading && (
                            <div className="absolute bottom-2 right-2 flex items-center justify-center bg-black/60 rounded-full w-8 h-8 p-1 backdrop-blur-md shadow-md z-20">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                )}

                {messageText && String(messageText).trim() !== "" && (
                  <p className="text-sm px-3 py-2 leading-relaxed whitespace-pre-wrap break-words">{messageText}</p>
                )}
                
                <div className={`text-[10px] text-right px-2 pb-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Just now"}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          
          {isRecording ? (
              <div className="flex-1 bg-gray-50 rounded-full flex items-center px-2 py-1.5 border border-red-200 animate-pulse-soft transition-all">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full mr-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-red-600 font-mono font-medium flex-1">{formatTime(recordingTime)}</span>
                  <button onClick={cancelRecording} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1">
                    <IoMdTrash className="text-xl" />
                  </button>
                  <button onClick={sendRecording} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-md active:scale-95">
                      <IoMdSend className="text-lg" />
                  </button>
              </div>
          ) : (
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