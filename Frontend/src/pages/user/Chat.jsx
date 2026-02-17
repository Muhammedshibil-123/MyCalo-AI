import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend, IoMdClose, IoMdPlay, IoMdMic, IoMdTrash, IoMdVideocam, IoMdCall } from 'react-icons/io';
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

  // Reconnection state
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { roomUploads, uploadFile, removeUpload } = useUpload();
  const roomUploadsRef = useRef(roomUploads); 
  
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
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => { roomUploadsRef.current = roomUploads; }, [roomUploads]);
  useEffect(() => { if (!doctor) navigate('/consult'); }, [doctor, navigate]);

  // Reconnect when app comes to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (socketRef.current && (socketRef.current.readyState === WebSocket.CLOSED || socketRef.current.readyState === WebSocket.CLOSING)) {
          setReconnectAttempt(prev => prev + 1);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host; 
    if (host.includes('localhost:5173')) host = 'localhost:8080';
    
    const wsUrl = `${protocol}//${host}/ws/chat/${roomId}/`;
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'call_user') {
            setIsReceivingCall(true);
            setIncomingCallData(data.data);
        } else if (data.type === 'call_ended') {
            setIsReceivingCall(false);
            setShowVideoCall(false);
            setIncomingCallData(null);
        } else if (data.type === 'chat_history') {
          setMessages(data.messages);
          // Sync Logic: Check if pending uploads are already in history
          const pending = roomUploadsRef.current[roomId] || [];
          if (pending.length > 0) {
             const lastMsg = data.messages[data.messages.length - 1];
             // If the last message in history is from me and has a file, assume it matches the pending one
             if (lastMsg && String(lastMsg.sender_id) === String(user.id) && lastMsg.file_url) {
                 removeUpload(roomId, pending[0].tempId);
             }
          }
        } else if (data.type === 'new_message') {
          if (String(data.sender_id) === String(user.id) && data.file_url) {
             const pending = roomUploadsRef.current[roomId] || [];
             if (pending.length > 0) removeUpload(roomId, pending[0].tempId);
          }

          const normalizedMsg = {
              Timestamp: data.timestamp,
              SenderID: data.sender_id,
              Message: data.message,
              FileUrl: data.file_url,
              FileType: data.file_type
          };

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.Timestamp === normalizedMsg.Timestamp && String(lastMsg.SenderID) === String(normalizedMsg.SenderID)) {
                return prev;
            }
            return [...prev, normalizedMsg];
          });
        }
      } catch (e) { console.error("WS Error:", e); }
    };

    socketRef.current = ws;
    return () => { if (ws.readyState === 1) ws.close(); };
  }, [roomId, accessToken, reconnectAttempt]); 

  // Smart Scroll: Instant on first load, Smooth on new messages
  useEffect(() => { 
    if (messagesEndRef.current) {
      if (isInitialLoad) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        if (displayMessages.length > 0) setIsInitialLoad(false);
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [displayMessages, isInitialLoad]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({ message: inputText, sender_id: user.id }));
    setInputText('');
  };

  const requestCall = () => {
    if (!socketRef.current) return;
    socketRef.current.send(JSON.stringify({ 
        message: "Requesting video call...", 
        sender_id: user.id,
        file_type: 'call_request' 
    }));
  };

  const answerCall = () => { setIsInitiator(false); setShowVideoCall(true); setIsReceivingCall(false); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file, roomId, null, user.id);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if(e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start(); setIsRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) { alert("Mic access denied."); }
  };

  const cleanupRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) { 
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); 
      }
      setIsRecording(false); 
      clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); }
      cleanupRecording();
  };

  const sendRecording = () => {
      if (!mediaRecorderRef.current) return;
      mediaRecorderRef.current.stop();
      cleanupRecording();
      
      setTimeout(() => {
          uploadFile(new File([new Blob(audioChunksRef.current, { type: 'audio/webm' })], `voice_${Date.now()}.webm`, { type: 'audio/webm' }), roomId, 'audio', user.id);
      }, 200);
  };

  if (!doctor) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm z-20 shrink-0">
        <button onClick={() => navigate('/consult')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
          {doctor.profile_image ? <img src={doctor.profile_image} className="w-full h-full object-cover" /> : doctor.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">Dr. {doctor.first_name || doctor.username}</h3>
          <p className="text-[10px] text-green-600 font-medium">● Online</p>
        </div>
        <button onClick={requestCall} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shrink-0">
            <IoMdVideocam className="text-xl" />
        </button>
      </div>

      {isReceivingCall && !showVideoCall && (
          <div className="fixed top-4 left-4 right-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-2xl z-[60] flex items-center justify-between animate-fade-in ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">D</div>
                  <div className="flex flex-col">
                      <span className="font-bold text-gray-900">Incoming Video Call</span>
                      <span className="text-xs text-gray-500">Dr. {doctor.username}</span>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setIsReceivingCall(false)} className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"><IoMdClose size={20} /></button>
                  <button onClick={answerCall} className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors animate-pulse"><IoMdCall size={20} /></button>
              </div>
          </div>
      )}

      {showVideoCall && <VideoCall socket={socketRef} user={user} roomId={roomId} isInitiator={isInitiator} signalData={incomingCallData} onClose={() => { setShowVideoCall(false); setIsReceivingCall(false); }} />}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((msg, index) => {
          const senderId = msg.SenderID || msg.sender_id;
          const isMe = Number(senderId) === Number(user.id);
          const fileUrl = msg.FileUrl || msg.file_url;
          const fileType = msg.FileType || msg.file_type;
          
          if (fileType === 'system') {
              return (
                  <div key={index} className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                          {msg.Message || msg.message}
                      </span>
                  </div>
              );
          }

          if (fileType === 'call_request') {
              return (
                <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                   <div className={`p-3 rounded-2xl max-w-[80%] ${isMe ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      <div className="flex items-center gap-2">
                          <IoMdVideocam size={20} />
                          <span className="text-sm font-semibold">{isMe ? "You requested a video call" : "Requested a video call"}</span>
                      </div>
                   </div>
                </div>
              );
          }

          return (
            <div key={msg.tempId || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-1 shadow-sm overflow-hidden ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                {fileUrl ? (
                    <div className="relative rounded-xl overflow-hidden mb-1">
                        {fileType === 'image' && <img src={fileUrl} className={`max-h-72 w-full object-contain bg-black/5 ${msg.isUploading ? 'opacity-70' : ''}`} onClick={() => !msg.isUploading && setSelectedMedia({ url: fileUrl, type: 'image' })} />}
                        {fileType === 'video' && (
                            <div className="relative cursor-pointer bg-black min-h-[150px] flex items-center justify-center" onClick={() => !msg.isUploading && setSelectedMedia({ url: fileUrl, type: 'video' })}>
                                <video src={fileUrl} className="max-h-72 w-full object-contain opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center"><IoMdPlay className="text-white text-4xl" /></div>
                            </div>
                        )}
                        {fileType === 'audio' && <div className="p-1"><CustomAudioPlayer src={fileUrl} isMe={isMe} /></div>}
                        {msg.isUploading && (
                            <div className="absolute bottom-2 right-2 flex items-center justify-center bg-black/60 rounded-full w-8 h-8 z-20">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                ) : null}
                {(msg.Message || msg.message) ? <p className="text-sm px-3 py-2 leading-relaxed break-words">{msg.Message || msg.message}</p> : null}
                <div className={`text-[9px] text-right px-2 pb-1 opacity-70`}>
                    {new Date(msg.Timestamp || msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-3 pb-safe shrink-0">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          {isRecording ? (
              <div className="flex-1 bg-gray-100 rounded-full flex items-center px-3 py-1.5 border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-red-600 font-mono text-sm flex-1">{formatTime(recordingTime)}</span>
                  <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-500"><IoMdTrash size={20} /></button>
                  <button onClick={sendRecording} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md"><IoMdSend size={20} /></button>
              </div>
          ) : (
              <>
                <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-95 transition-all"><RiImageAddLine size={24} /></button>
                <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,audio/*" onChange={handleFileSelect} />
                <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2.5 border border-transparent focus-within:bg-white focus-within:border-blue-500 transition-all">
                    <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Message..." className="bg-transparent flex-1 outline-none text-sm text-gray-800" />
                </div>
                {inputText.trim() ? (
                    <button onClick={handleSendMessage} className="w-11 h-11 shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all"><IoMdSend size={24} /></button>
                ) : (
                    <button onClick={startRecording} className="w-11 h-11 shrink-0 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center active:scale-95 transition-all"><IoMdMic size={24} /></button>
                )}
              </>
          )}
        </div>
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in">
          <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white z-[110]"><IoMdClose size={24} /></button>
          <div className="w-full h-full flex items-center justify-center p-2">
            {selectedMedia.type === 'video' ? <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full" /> : <img src={selectedMedia.url} className="max-w-full max-h-full object-contain" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;