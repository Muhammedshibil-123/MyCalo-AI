import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios'; // Adjust path if needed based on your folder structure

const DoctorConsultList = () => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await api.get('/chat/doctor-consultations/');
        setChats(response.data); 
      } catch (err) {
        console.error("Failed to load consultations", err);
      }
    };
    fetchConsultations();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Patient Consultations</h2>
      <div className="space-y-4">
        {chats.length === 0 ? (
           <p className="text-gray-500">No active consultations.</p>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.room_id}
              onClick={() => navigate(`/doctor/chat/${chat.room_id}`, { state: { patient: chat.patient_data || chat.user } })}
              className="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-500 cursor-pointer flex justify-between items-center transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  {/* Handle case where username might be missing */}
                  {(chat.patient_data?.username || chat.user?.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold">
                    {chat.patient_data?.first_name || chat.patient_data?.username || chat.user?.username}
                  </h4>
                  <p className="text-sm text-gray-500 truncate w-64">
                    {chat.last_message || "Active chat"}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {chat.timestamp || chat.last_timestamp ? new Date(chat.timestamp || chat.last_timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorConsultList;