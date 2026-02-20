import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../lib/axios';

const ChatAI = () => {
    const { user } = useSelector((state) => state.auth); // Pull user_id from Redux
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // 1. Fetch history from DynamoDB via FastAPI on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axiosInstance.get(`http://localhost:8001/chat-groq/history/${user.id}`);
                if (response.data.success) {
                    setMessages(response.data.history);
                }
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };
        if (user?.id) fetchHistory();
    }, [user?.id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userQuery = input;
        setInput(""); // Clear input instantly

        // 2. Optimistic Update: Add user message to UI immediately
        const userMsg = {
            SenderType: "user",
            Message: userQuery,
            Timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);

        setIsLoading(true);

        try {
            // 3. Call your Groq Agent endpoint
            const response = await axiosInstance.post("http://localhost:8001/chat-groq/ask", {
                query: userQuery,
                user_id: user.id
            });

            if (response.data.success) {
                // 4. Update UI with AI response without re-rendering the whole page
                const aiMsg = {
                    SenderType: "ai",
                    Message: response.data.response,
                    Timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (error) {
            console.error("Agent Error:", error);
            setMessages(prev => [...prev, {
                SenderType: "ai",
                Message: "Sorry, I'm having trouble connecting to my brain right now.",
                Timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[85vh] bg-gray-50 rounded-xl shadow-inner max-w-2xl mx-auto p-4">
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.SenderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.SenderType === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}>
                            <p className="text-sm">{msg.Message}</p>
                            <span className="text-[10px] opacity-70 block mt-1">
                                {new Date(msg.Timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl border border-gray-200 animate-pulse text-gray-400 text-xs">
                            MyCalo AI is thinking...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your calories or a recipe..."
                    className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </form>
        </div>
    );
};

export default ChatAI;