import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend, IoMdCheckmarkCircle, IoMdClose, IoMdPlay, IoMdMic, IoMdSquare, IoMdTrash, IoMdVideocam, IoMdCall } from 'react-icons/io';
import { RiImageAddLine } from 'react-icons/ri';
import api from '../../lib/axios';
import { useUpload } from '../../context/UploadContext';
import CustomAudioPlayer from '../../components/CustomAudioPlayer';
import VideoCall from '../../components/VideoCall';

const DoctorChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, accessToken } = useSelector((state) => state.auth);
  const patient = location.state?.patient;
  const initialStatus = location.state?.status || 'active';
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isResolved, setIsResolved] = useState(initialStatus === 'resolved');
  
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const { roomUploads, uploadFile, removeUpload } = useUpload();
  const pendingMessages = roomUploads[roomId] || [];
  
  const displayMessages = [...messages, ...pendingMessages].sort((a, b) => {
      const t1 = new Date(a.Timestamp || a.timestamp || 0).getTime();
      const t2 = new Date(b.Timestamp || b.timestamp || 0).getTime();
      return t1 - t2;
  });

  const [selectedMedia, setSelectedMedia] = useState(null); 
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!roomId || !accessToken || isResolved) return;
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
             if (pending.length > 0) removeUpload(roomId, pending[0].tempId);
          }
        }
      } catch (err) { console.error("WS Error:", err); }
    };

    socketRef.current = ws;
    return () => { if (ws.readyState === 1) ws.close(); };
  }, [roomId, accessToken, isResolved, roomUploads]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [displayMessages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current || isResolved) return;
    
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
    if (e.target.files[0]) {
        uploadFile(e.target.files[0], roomId, null, user.id);
        fileInputRef.current.value = '';
    }
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
          const audioFile = new File([new Blob(audioChunksRef.current, { type: 'audio/webm' })], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          uploadFile(audioFile, roomId, 'audio', user.id);
      }, 200);
  };

  const handleResolve = async () => {
    if (!window.confirm('Mark resolved?')) return;
    setIsResolving(true);
    try {
      await api.post(`/chat/resolve/${roomId}/`);
      setIsResolved(true);
      if (socketRef.current) socketRef.current.close();
      setTimeout(() => navigate('/doctor/consult'), 1500);
    } catch (error) { alert("Failed."); } finally { setIsResolving(false); }
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
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
            <>
                <button onClick={startCall} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                    <IoMdVideocam className="text-xl" />
                </button>
                
                <button onClick={handleResolve} disabled={isResolving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-md">
                    {isResolving ? "..." : <> <IoMdCheckmarkCircle className="text-lg" /> Resolve </>}
                </button>
            </>
        )}
      </div>

      {isReceivingCall && !showVideoCall && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-bounce">
              <div className="flex flex-col">
                  <span className="font-bold text-lg">Incoming Video Call...</span>
                  <span className="text-sm text-gray-300">{patient?.username || "Patient"} is calling</span>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {displayMessages.map((msg, i) => {
          const senderId = msg.SenderID || msg.sender_id;
          const timestamp = msg.Timestamp || msg.timestamp;
          const messageText = msg.Message || msg.message;
          const fileType = msg.FileType || msg.file_type;
          const fileUrl = msg.FileUrl || msg.file_url;
          
          const isMe = Number(senderId) === Number(user.id);
          const isUploading = msg.isUploading;
          
          return (
            <div key={msg.tempId || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold mr-2 self-end mb-1">{(patient?.username || "P")[0].toUpperCase()}</div>}
              
              <div className={`relative max-w-[75%] rounded-2xl p-1 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                
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
                  {new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        {!isResolved ? (
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            {isRecording ? (
              <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 border border-red-200 animate-pulse-soft transition-all">
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
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                        placeholder="Type your advice..." 
                        className="bg-transparent flex-1 outline-none text-sm text-gray-800 placeholder-gray-400" 
                    />
                </div>

                {inputText.trim() ? (
                    <button onClick={sendMessage} className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95">
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
        ) : (
          <div className="text-center py-3 text-gray-500 text-sm font-medium">This consultation is resolved.</div>
        )}
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

export default DoctorChatPage;