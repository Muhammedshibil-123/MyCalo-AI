import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

// --- MAIN CONSULT COMPONENT ---
const Consult = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // Navigate to Chat.jsx component with doctor data
    navigate('/chat', { state: { doctor } });
  };

  // Show doctor list
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