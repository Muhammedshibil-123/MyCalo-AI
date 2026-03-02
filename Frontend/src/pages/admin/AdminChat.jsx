import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMessageSquare } from 'react-icons/fi';
import { IoMdPlay, IoMdClose, IoMdVideocam } from 'react-icons/io';
import api from '../../lib/axios';
import CustomAudioPlayer from '../../components/CustomAudioPlayer';

const AdminChat = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const scrollRef = useRef(null);

    // Extract IDs from Room ID (e.g., "user_6_doc_5")
    const parts = roomId.split('_');
    const patientId = parts[1];
    const doctorId = parts[3];

    useEffect(() => {
        fetchChatHistory();
    }, [roomId]);

    useEffect(() => {
        // Auto-scroll to bottom when messages load
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchChatHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/chat/admin/consultation-messages/${roomId}/`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        // Changed outer container height to h-full flex-1 min-h-[calc(100vh-4rem)] to fill the screen
        <div className="flex flex-col flex-1 h-full min-h-[calc(100vh-4rem)] w-full max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in duration-500 font-sans">
            
            {/* Header - Original Dark Theme */}
            <div className="mb-4 flex items-center justify-between bg-zinc-900 p-4 border border-zinc-800 rounded-xl shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white tracking-tight">Consultation Monitor</h1>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">Room: {roomId}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                        Patient ID: {patientId}
                    </div>
                    <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                        Doctor ID: {doctorId}
                    </div>
                </div>
            </div>

            {/* Chat Area - flex-1 allows it to take up all remaining vertical space */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-5 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl mb-4 scrollbar-hide shadow-inner"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-zinc-500 text-sm font-medium">Loading logs...</p>
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const isPatient = String(msg.SenderID) === String(patientId);
                        const fileType = msg.FileType || msg.file_type;
                        const fileUrl = msg.FileUrl || msg.file_url;
                        const messageText = msg.Message || msg.message;

                        // 1. Render System Messages (Call ended, Started, etc.)
                        if (fileType === 'system') {
                            return (
                                <div key={index} className="flex justify-center my-6">
                                    <span className="text-xs text-zinc-400 font-medium bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 shadow-sm">
                                        {messageText}
                                    </span>
                                </div>
                            );
                        }

                        // 2. Render Call Request Messages
                        if (fileType === 'call_request') {
                            return (
                                <div key={index} className="flex justify-center my-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm text-sm text-zinc-300">
                                        <IoMdVideocam size={18} className={isPatient ? "text-zinc-500" : "text-blue-400"} />
                                        <span className="font-medium">
                                            {isPatient ? "Patient requested a video call" : "Doctor requested a video call"}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        // 3. Render Standard Chat Bubbles (Text, Image, Video, Audio)
                        return (
                            <div 
                                key={index} 
                                className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                                    
                                    {/* Sender Label */}
                                    <span className="text-[10px] text-zinc-500 mb-1 px-2 uppercase font-bold tracking-tight">
                                        {isPatient ? 'Patient' : 'Doctor'}
                                    </span>

                                    {/* Message Bubble */}
                                    <div className={`p-1.5 rounded-2xl text-sm shadow-sm ${
                                        isPatient 
                                            ? 'bg-zinc-800 text-zinc-100 rounded-tl-sm border border-zinc-700' 
                                            : 'bg-blue-600 text-white rounded-tr-sm'
                                    }`}>
                                        
                                        {/* Media Rendering */}
                                        {fileUrl ? (
                                            <div className="relative rounded-xl overflow-hidden mb-1">
                                                {fileType === 'image' && (
                                                    <img 
                                                        src={fileUrl} 
                                                        className="max-h-72 w-full object-contain bg-black/20 cursor-pointer" 
                                                        onClick={() => setSelectedMedia({ url: fileUrl, type: 'image' })} 
                                                    />
                                                )}
                                                {fileType === 'video' && (
                                                    <div 
                                                        className="relative cursor-pointer bg-black/50 min-h-[150px] flex items-center justify-center rounded-xl overflow-hidden" 
                                                        onClick={() => setSelectedMedia({ url: fileUrl, type: 'video' })}
                                                    >
                                                        <video src={fileUrl} className="max-h-72 w-full object-contain opacity-70" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <IoMdPlay className="text-white text-4xl drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                )}
                                                {fileType === 'audio' && (
                                                    <div className="p-1 min-w-[220px]">
                                                        <CustomAudioPlayer src={fileUrl} isMe={!isPatient} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Text Content */}
                                        {messageText && (
                                            <p className="px-3 py-1.5 leading-relaxed break-words">
                                                {messageText}
                                            </p>
                                        )}

                                        {/* Timestamp */}
                                        <div className={`text-[9px] mt-0.5 px-2 pb-1 flex items-center gap-1 justify-end ${isPatient ? 'text-zinc-400' : 'text-blue-200'}`}>
                                            <FiClock size={10} />
                                            {formatTime(msg.Timestamp || msg.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
                        <FiMessageSquare size={48} className="opacity-20" />
                        <p className="text-sm font-medium">No messages found in this session.</p>
                    </div>
                )}
            </div>

            {/* Footer Disclaimer */}
            <div className="text-center shrink-0">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                    Admin View Only • Real-time Monitoring Disabled for Security
                </p>
            </div>

            {/* Fullscreen Media Modal */}
            {selectedMedia && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                    <button 
                        onClick={() => setSelectedMedia(null)} 
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-[110]"
                    >
                        <IoMdClose size={26} />
                    </button>
                    <div className="w-full h-full flex items-center justify-center p-4">
                        {selectedMedia.type === 'video' ? (
                            <video src={selectedMedia.url} controls autoPlay className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl" />
                        ) : (
                            <img src={selectedMedia.url} className="max-w-[90%] max-h-[90%] object-contain rounded-xl shadow-2xl" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminChat;