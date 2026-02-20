import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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

    return (
        <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
            msg.SenderType === 'user' 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
        }`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayedText}</p>
            <span className={`text-[10px] block mt-1 ${msg.SenderType === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
    );
};

const ChatAI = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Fetch history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get("/chat-groq/history", { skipLoading: true });
                if (response.data.success) {
                    const history = response.data.history.map(m => ({ ...m, animate: false }));
                    setMessages(history);
                }
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };
        if (user?.id) fetchHistory();
    }, [user?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

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
            const response = await api.post("/chat-groq/ask", {
                query: userQuery
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
                Message: "Sorry, I'm having trouble connecting to my systems right now.",
                Timestamp: new Date().toISOString(),
                animate: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full md:h-[85vh] bg-gray-50 md:rounded-xl md:shadow-lg max-w-3xl mx-auto overflow-hidden">
            
            {/* Header with Back Button */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center shadow-sm shrink-0 z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mr-3"
                >
                    <FaArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-bold text-gray-800">
                    AI Assistant
                </h2>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-50">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm">Ask me about your calories, diet, or recipes!</p>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.SenderType === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <MessageBubble msg={msg} />
                    </div>
                ))}
                
                {/* Custom 3-Dots Animation */}
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm rounded-tl-none flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-200 shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AI Assistant..."
                        /* FIX: Changed px-5 to pl-5 pr-14 to stop text before the button */
                        className="flex-1 py-3 pl-5 pr-14 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all shadow-inner"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full flex items-center justify-center transition-all ${
                            isLoading || !input.trim() 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105'
                        }`}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current ml-1"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatAI;