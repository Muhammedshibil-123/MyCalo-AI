import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';

// --- Icons ---
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);

// --- CHAT INTERFACE COMPONENT ---
const ChatInterface = ({ doctor, onBack }) => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // WebSocket Connection
  useEffect(() => {
    if (!doctor || !user?.id) return;

    const roomId = `user_${user.id}_doc_${doctor.id}`;
    const wsUrl = `ws://localhost:8080/ws/chat/${roomId}/`;
    
    // Pass token in protocols for browser compatibility
    const ws = new WebSocket(wsUrl, [accessToken]);

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
  }, [doctor, user, accessToken]);

  // Auto-scroll
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

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:static md:rounded-2xl md:shadow-lg">
      {/* Chat Header */}
      <div className="p-3 border-b flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-1">
          <BackIcon />
        </button>
        
        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
          {doctor.profile_image ? (
            <img src={doctor.profile_image} alt="doc" className="w-full h-full object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
              {doctor.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">Dr. {doctor.first_name || doctor.username}</h3>
          <p className="text-xs text-gray-500">Active now</p>
        </div>
        
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
                <div className="w-7 h-7 rounded-full bg-gray-200 mr-2 flex-shrink-0 self-end mb-1" />
              )}
              
              <div className={`max-w-[70%] p-3 rounded-[20px] ${
                isMe 
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200' 
              }`}>
                {(msg.FileType === 'image' || msg.file_type === 'image') && (
                  <img 
                    src={msg.FileUrl || msg.file_url} 
                    alt="shared" 
                    className="rounded-xl mb-2 w-full object-cover cursor-pointer"
                    onClick={() => window.open(msg.FileUrl || msg.file_url, '_blank')}
                  />
                )}
                {(msg.FileType === 'video' || msg.file_type === 'video') && (
                  <video controls className="rounded-xl mb-2 w-full">
                    <source src={msg.FileUrl || msg.file_url} />
                  </video>
                )}
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
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <CameraIcon />
          )}
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
        
        {inputText.length === 0 && (
          <div className="p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN CONSULT COMPONENT ---
const Consult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if doctor ID is in URL
  useEffect(() => {
    const doctorId = searchParams.get('doctor');
    if (doctorId && doctors.length > 0) {
      const doctor = doctors.find(d => d.id === parseInt(doctorId));
      if (doctor) setSelectedDoctor(doctor);
    }
  }, [searchParams, doctors]);

  // Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/api/users/doctors/');
        setDoctors(response.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDoctors();
  }, [user]);

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    // Update URL for deep linking
    navigate(`/chat?doctor=${doctor.id}`, { replace: true });
  };

  const handleBackToDoctors = () => {
    setSelectedDoctor(null);
    navigate('/chat', { replace: true });
  };

  // If doctor is selected, show chat interface
  if (selectedDoctor) {
    return <ChatInterface doctor={selectedDoctor} onBack={handleBackToDoctors} />;
  }

  // Otherwise, show doctor list
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white md:bg-gray-50 max-w-6xl mx-auto md:p-4">
      <div className="w-full bg-white md:rounded-2xl md:shadow-lg flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900">Consultations</h1>
          <span className="text-blue-500 font-semibold cursor-pointer">Requests</span>
        </div>

        {/* Doctor List */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleDoctorSelect(doc)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white p-[2px]">
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg overflow-hidden">
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

                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            ))}
            
            {doctors.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <p className="text-gray-400 font-medium">No doctors available</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for consultations</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Consult;