import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { FiCpu } from 'react-icons/fi';
import api from '../../lib/axios'; 

// --- TYPEWRITER COMPONENT ---
const MessageBubble = ({ msg }) => {
    const [displayedText, setDisplayedText] = useState(msg.animate ? "" : msg.Message);

    useEffect(() => {
        if (msg.animate && msg.SenderType === 'ai') {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedText(msg.Message.slice(0, i + 1));
                i++;
                if (i >= msg.Message.length) clearInterval(interval);
            }, 10); 
            return () => clearInterval(interval);
        } else {
            setDisplayedText(msg.Message);
        }
    }, [msg]);

    const isUser = msg.SenderType === 'user';

    return (
        <div className={`max-w-[85%] p-4 rounded-2xl border ${
            isUser 
            ? 'bg-white text-black border-white rounded-tr-sm' 
            : 'bg-[#0A0A0A] text-white border-zinc-800 rounded-tl-sm'
        }`}>
            <p className="text-[15px] whitespace-pre-wrap leading-relaxed tracking-tight font-medium">
                {displayedText}
            </p>
            <span className={`text-[10px] block mt-2 font-medium tracking-wide ${isUser ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {new Date(msg.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
    );
};

const PatientAIChat = () => {
    const navigate = useNavigate();
    
    // 1. Grab the roomId from the URL (e.g., "user_6_doc_5")
    const { roomId } = useParams(); 
    
    // 2. Extract just the patient ID number from the string
    const patientId = roomId ? roomId.split('_')[1] : null;
    
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Unique session storage key for this specific patient
    const sessionKey = `doctor_ai_chat_patient_${patientId}`;

    // Fetch history from Session Storage on mount
    useEffect(() => {
        if (patientId) {
            const savedChat = sessionStorage.getItem(sessionKey);
            if (savedChat) {
                const parsedHistory = JSON.parse(savedChat).map(m => ({ ...m, animate: false }));
                setMessages(parsedHistory);
            }
        }
    }, [patientId, sessionKey]);

    // Save to Session Storage whenever messages update
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(sessionKey, JSON.stringify(messages));
        }
    }, [messages, sessionKey]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !patientId) return;

        const userQuery = input;
        setInput(""); 

        // Optimistic Update
        const userMsg = {
            SenderType: "user",
            Message: userQuery,
            Timestamp: new Date().toISOString(),
            animate: false
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await api.post("/chat-groq/ask_doc", {
                query: userQuery,
                user_id: parseInt(patientId) 
            }, { skipLoading: true });

            if (response.data.success) {
                const aiMsg = {
                    SenderType: "ai",
                    Message: response.data.response,
                    Timestamp: new Date().toISOString(),
                    animate: true 
                };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (error) {
            console.error("Agent Error:", error);
            setMessages(prev => [...prev, {
                SenderType: "ai",
                Message: "Sorry, I'm having trouble connecting to the patient database right now.",
                Timestamp: new Date().toISOString(),
                animate: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Changed to h-full w-full with purely dark Vercel-style backgrounds.
        // Removed max-width, shadows, and outer borders to make it fill the screen completely.
        <div className="flex flex-col h-full w-full bg-black font-sans">
            
            {/* Header */}
            <div className="bg-black border-b border-zinc-800 p-4 px-6 flex items-center shrink-0 z-10 sticky top-0">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors mr-4"
                >
                    <FaArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                        Clinical AI Assistant
                    </h2>
                    <p className="text-xs font-medium text-zinc-500 mt-0.5">
                        Analyzing Patient #{patientId}
                    </p>
                </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                        <div className="w-14 h-14 border border-zinc-800 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
                            <FiCpu size={24} className="text-white" />
                        </div>
                        <p className="text-sm font-medium tracking-tight text-zinc-400">Ask about Patient #{patientId}'s diet and logs</p>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.SenderType === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <MessageBubble msg={msg} />
                    </div>
                ))}
                
                {/* Custom Minimalist Dark 3-Dots Animation */}
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-[#0A0A0A] p-4 py-5 rounded-2xl border border-zinc-800 rounded-tl-none flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="bg-black p-4 border-t border-zinc-800 shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative max-w-5xl mx-auto w-full">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Query Patient #${patientId} data...`}
                        className="flex-1 py-4 pl-6 pr-16 rounded-full border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-white focus:border-white bg-[#0A0A0A] text-white text-[15px] font-medium transition-all placeholder-zinc-500"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-2 top-2 bottom-2 aspect-square rounded-full flex items-center justify-center transition-all ${
                            isLoading || !input.trim() 
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800' 
                            : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                        }`}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current ml-0.5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PatientAIChat;