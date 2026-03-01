import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiClock, FiFile, FiImage } from 'react-icons/fi';
import api from '../../lib/axios';

const AdminChat = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
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
        <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between bg-zinc-900 p-4 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white">Consultation Monitor</h1>
                        <p className="text-xs text-zinc-500">Room: {roomId}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 uppercase font-bold">
                        Patient ID: {patientId}
                    </div>
                    <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400 uppercase font-bold">
                        Doctor ID: {doctorId}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl mb-4 scrollbar-hide"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-zinc-500 text-sm">Loading logs...</p>
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const isPatient = String(msg.SenderID) === String(patientId);
                        
                        return (
                            <div 
                                key={index} 
                                className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[80%] flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                                    {/* Sender Label */}
                                    <span className="text-[10px] text-zinc-500 mb-1 px-2 uppercase font-bold tracking-tight">
                                        {isPatient ? 'Patient' : 'Doctor'}
                                    </span>

                                    {/* Message Bubble */}
                                    <div className={`p-3 rounded-2xl text-sm ${
                                        isPatient 
                                            ? 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700' 
                                            : 'bg-blue-600 text-white rounded-tr-none'
                                    }`}>
                                        {msg.FileType === 'image' ? (
                                            <img src={msg.FileUrl} alt="Upload" className="max-w-full rounded-lg mb-2" />
                                        ) : msg.FileType === 'audio' ? (
                                            <div className="flex items-center gap-2 italic">
                                                <FiFile /> Voice Message
                                            </div>
                                        ) : (
                                            <p>{msg.Message}</p>
                                        )}
                                        
                                        <div className={`text-[9px] mt-1 flex items-center gap-1 ${isPatient ? 'text-zinc-500' : 'text-blue-200'}`}>
                                            <FiClock size={10} />
                                            {formatTime(msg.Timestamp)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                        <FiMessageSquare size={48} className="mb-2 opacity-20" />
                        <p>No messages found in this session.</p>
                    </div>
                )}
            </div>

            {/* Footer Disclaimer */}
            <div className="text-center">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                    Admin View Only • Real-time Monitoring Disabled for Security
                </p>
            </div>
        </div>
    );
};

export default AdminChat;