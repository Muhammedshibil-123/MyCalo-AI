import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../../lib/axios'; // Using your configured axios instance

// --- Icons (Instagram-style) ---
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const ImagePlaceholder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);

const Chat = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false); // For mobile navigation

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Fetch Doctors using the Axios Instance (Gateway Port 8080)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // This hits http://localhost:8080/api/accounts/doctors/
        const response = await api.get('/api/accounts/doctors/');
        setDoctors(response.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    if (user) fetchDoctors();
  }, [user]);

  // 2. WebSocket Connection
  useEffect(() => {
    if (!selectedDoctor || !user?.id) return;

    // Open Mobile Chat View
    setShowMobileChat(true);

    const roomId = `user_${user.id}_doc_${selectedDoctor.id}`;
    
    // Gateway WebSocket URL
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    
    // Pass token in 'protocols' to bypass browser header restrictions
    const ws = new WebSocket(wsUrl, [token]);

    ws.onopen = () => console.log('Connected to:', roomId);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_history') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("WS Parse Error:", e);
      }
    };

    ws.onclose = () => console.log('Disconnected');
    socketRef.current = ws;

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [selectedDoctor, user, token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({ 
      message: inputText, 
      sender_id: user.id 
    }));
    setInputText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload via Gateway (Nginx /chat/ route)
      const response = await api.post('/chat/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { url, resource_type } = response.data;
      
      socketRef.current.send(JSON.stringify({
        message: resource_type === 'video' ? 'Sent a video' : 'Sent an image',
        file_url: url,
        file_type: resource_type,
        sender_id: user.id
      }));

    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackToDoctors = () => {
    setSelectedDoctor(null);
    setShowMobileChat(false);
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white md:bg-gray-50 max-w-6xl mx-auto md:p-4 gap-4">
      
      {/* --- LIST VIEW (Inbox) --- */}
      <div className={`w-full md:w-1/3 bg-white md:rounded-2xl md:shadow-lg flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900">Consultations</h1>
          <span className="text-blue-500 font-semibold cursor-pointer">Requests</span>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoctor(doc)}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg overflow-hidden">
                      {/* Avatar Image or Initial */}
                      {doc.profile_image ? (
                        <img src={doc.profile_image} alt={doc.username} className="w-full h-full object-cover" />
                      ) : (
                        doc.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">Dr. {doc.first_name || doc.username}</p>
                <p className="text-sm text-gray-500 truncate">{doc.specialization || "General Physician"} • Active now</p>
              </div>
            </div>
          ))}
          
          {doctors.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <p>No active consultations found.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- CHAT VIEW (Thread) --- */}
      <div className={`w-full md:w-2/3 bg-white md:rounded-2xl md:shadow-lg flex flex-col ${showMobileChat ? 'flex fixed inset-0 z-50 md:static' : 'hidden md:flex'}`}>
        
        {selectedDoctor ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
              <button onClick={handleBackToDoctors} className="md:hidden p-1">
                <BackIcon />
              </button>
              
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                 {selectedDoctor.profile_image ? (
                    <img src={selectedDoctor.profile_image} alt="doc" className="w-full h-full object-cover"/>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                      {selectedDoctor.username?.charAt(0).toUpperCase()}
                    </div>
                 )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Dr. {selectedDoctor.first_name || selectedDoctor.username}</h3>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
              
              {/* Fake Video/Call Icons for aesthetic */}
              <div className="flex gap-4 pr-2 text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
              {messages.map((msg, index) => {
                const isMe = msg.SenderID === user.id || msg.sender_id === user.id;
                
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 mr-2 flex-shrink-0 self-end mb-1">
                         {/* Tiny avatar next to message */}
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] p-3 rounded-[20px] ${
                      isMe 
                        ? 'bg-blue-500 text-white rounded-br-sm' // MyCalo Green or Blue
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200' 
                    }`}>
                      {/* Media */}
                      {(msg.FileType === 'image' || msg.file_type === 'image') && (
                        <img 
                          src={msg.FileUrl || msg.file_url} 
                          alt="shared" 
                          className="rounded-xl mb-2 w-full object-cover"
                          onClick={() => window.open(msg.FileUrl || msg.file_url, '_blank')}
                        />
                      )}
                      {(msg.FileType === 'video' || msg.file_type === 'video') && (
                        <video controls className="rounded-xl mb-2 w-full">
                          <source src={msg.FileUrl || msg.file_url} />
                        </video>
                      )}

                      {/* Text */}
                      {(msg.Message || msg.message) && (
                        <p className="text-sm leading-relaxed">{msg.Message || msg.message}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white flex items-center gap-3 border-t safe-area-pb">
              <label className="p-2 bg-blue-500 rounded-full text-white cursor-pointer shrink-0">
                <input 
                  type="file" 
                  hidden 
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CameraIcon />}
              </label>

              <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 border border-gray-200">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Message..."
                  className="bg-transparent flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
                />
                {inputText.length > 0 && (
                  <button onClick={handleSendMessage} className="ml-2 font-semibold text-blue-500 text-sm">
                    Send
                  </button>
                )}
              </div>
              
              {/* Optional: Heart/Like icon if input is empty like Instagram */}
              {inputText.length === 0 && (
                 <div className="p-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                 </div>
              )}
            </div>
          </>
        ) : (
          /* Desktop Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-800 bg-white">
            <div className="w-24 h-24 border-2 border-black rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </div>
            <h2 className="text-xl font-light">Your Messages</h2>
            <p className="text-sm text-gray-500 mt-2">Send photos and messages to your doctor.</p>
            <button className="mt-6 bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-semibold">
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;