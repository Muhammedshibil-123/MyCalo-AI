import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

const DoctorConsultList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch real consultation data from backend
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/chat/doctor-consultations/');
        setChats(response.data);
      } catch (err) {
        console.error("Failed to load consultations", err);
        setError("Failed to load consultations");
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsultations();
  }, []);

  // Helper to format timestamp
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patient Consultations</h2>
        <p className="text-sm text-gray-500 mt-1">
          {chats.length} active {chats.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      {chats.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Consultations</h3>
          <p className="text-gray-500">Patient messages will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <div 
              key={chat.room_id}
              onClick={() => navigate(`/doctor/chat/${chat.room_id}`, { 
                state: { patient: chat.patient_data } 
              })}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center font-bold text-blue-600 text-xl border-2 border-white shadow-sm">
                    {(chat.patient_data?.username || "?")[0].toUpperCase()}
                  </div>
                  {/* Online indicator (optional) */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 text-base truncate">
                      {chat.patient_data?.first_name || chat.patient_data?.username || `Patient ${chat.patient_id}`}
                    </h4>
                    <span className="text-xs text-gray-400 font-medium ml-2 shrink-0">
                      {formatTime(chat.last_timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate leading-tight">
                    {chat.last_message || "No messages yet"}
                  </p>
                  
                  {/* Optional: Show if last message was from patient */}
                  {Number(chat.sender_id) === Number(chat.patient_id) && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-blue-600 font-medium">New message</span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-gray-400 group-hover:text-blue-500 transition-colors shrink-0"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorConsultList;