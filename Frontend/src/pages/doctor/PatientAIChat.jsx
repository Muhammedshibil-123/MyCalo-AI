import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
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
        <div className={`max-w-[80%] p-3.5 rounded-2xl shadow-sm border ${
            isUser 
            ? 'bg-black text-white border-black rounded-tr-none' 
            : 'bg-white text-gray-900 border-gray-200 rounded-tl-none'
        }`}>
            <p className="text-[15px] whitespace-pre-wrap leading-relaxed tracking-tight font-medium">
                {displayedText}
            </p>
            <span className={`text-[10px] block mt-1.5 font-medium tracking-wide ${isUser ? 'text-gray-400' : 'text-gray-400'}`}>
                {new Date(msg.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
    );
};

const PatientAIChat = () => {
    const navigate = useNavigate();
    
    // Assuming you pass the patient's ID in the URL like /doctor/patient/:patientId/ai-chat
    // If you pass it via props instead, remove useParams and add patientId to the component arguments
    const { patientId } = useParams(); 
    
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Unique session storage key for this specific patient
    const sessionKey = `doctor_ai_chat_patient_${patientId}`;

    // 1. Fetch history from Session Storage on mount
    useEffect(() => {
        if (patientId) {
            const savedChat = sessionStorage.getItem(sessionKey);
            if (savedChat) {
                // Parse and ensure old messages don't re-animate
                const parsedHistory = JSON.parse(savedChat).map(m => ({ ...m, animate: false }));
                setMessages(parsedHistory);
            }
        }
    }, [patientId, sessionKey]);

    // 2. Save to Session Storage whenever messages update
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
            // Pointing to your Doctor AI endpoint
            const response = await api.post("/chat-doctor/ask", {
                query: userQuery,
                user_id: parseInt(patientId) // Passing the specific patient ID
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
        <div className="flex flex-col h-[100dvh] w-full md:h-[85vh] bg-[#FAFAFA] md:border md:border-gray-200 md:rounded-xl md:shadow-sm max-w-3xl mx-auto overflow-hidden font-sans">
            
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center shrink-0 z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors mr-3"
                >
                    <FaArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                        Clinical AI Assistant
                    </h2>
                    <p className="text-xs font-medium text-gray-500">
                        Analyzing Patient #{patientId}
                    </p>
                </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#FAFAFA]">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <p className="text-sm font-medium tracking-tight text-gray-500">Ask about Patient #{patientId}'s diet and logs</p>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.SenderType === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <MessageBubble msg={msg} />
                    </div>
                ))}
                
                {/* Custom Minimalist 3-Dots Animation */}
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white p-4 py-5 rounded-2xl border border-gray-200 shadow-sm rounded-tl-none flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-200 shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Query Patient #${patientId} data...`}
                        className="flex-1 py-3.5 pl-5 pr-14 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white text-sm font-medium transition-all placeholder-gray-400"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full flex items-center justify-center transition-all ${
                            isLoading || !input.trim() 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                            : 'bg-black text-white hover:bg-gray-800 active:scale-95'
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