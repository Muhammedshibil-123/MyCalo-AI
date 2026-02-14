import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoMdArrowBack, IoMdSend } from 'react-icons/io';

const DoctorChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get logged-in doctor info
  const { user, accessToken } = useSelector((state) => state.auth);
  
  // Get patient info passed via navigation state
  const patient = location.state?.patient;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!roomId || !accessToken) return;

    // Connect to WebSocket
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    const ws = new WebSocket(wsUrl, [accessToken]);

    ws.onopen = () => console.log("Connected to room:", roomId);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_history') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    socketRef.current = ws;

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [roomId, accessToken]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    
    socketRef.current.send(JSON.stringify({
      message: inputText,
      sender_id: user.id
    }));
    
    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Patient Info */}
      <div className="p-4 border-b flex items-center gap-4 bg-white shadow-sm z-10">
        <IoMdArrowBack 
          className="cursor-pointer text-xl text-gray-600 hover:text-gray-900" 
          onClick={() => navigate('/doctor/consult')} 
        />
        <div>
          <div className="font-bold text-lg">
            {patient?.first_name ? `${patient.first_name}` : patient?.username || "Patient"}
          </div>
          <div className="text-xs text-green-600">Online Consultation</div>
        </div>
        <div className="ml-auto text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
          Medical Consult
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => {
          // Robust check for "isMe" considering string/number differences
          const msgSenderId = msg.SenderID || msg.sender_id;
          const isMe = Number(msgSenderId) === Number(user.id);
          
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.Message || msg.message}</p>
                <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                   {new Date(msg.Timestamp || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t flex gap-3 items-center">
        <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <input 
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Type your advice..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
        </div>
        <button 
            onClick={sendMessage} 
            disabled={!inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IoMdSend className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default DoctorChatPage;