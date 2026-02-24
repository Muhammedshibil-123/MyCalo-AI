import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiUser, FiActivity, FiSearch } from 'react-icons/fi';
import api from '../../lib/axios';

const Consult = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [doctors, setDoctors] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Add state for the search query
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsRes, profileRes] = await Promise.all([
          api.get('/api/users/doctors/'),
          api.get('/api/profiles/me/').catch(() => ({ data: null })) 
        ]);
        
        setDoctors(doctorsRes.data);
        if (profileRes.data) {
          setUserProfile(profileRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDoctorSelect = (doctor) => {
    navigate('/chat', { state: { doctor } });
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${path}`;
  };

  // 2. Filter doctors based on the search query (by specialization or name)
  const filteredDoctors = doctors.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const specialization = doc.doctor_profile?.specialization?.toLowerCase() || "";
    const name = doc.username?.toLowerCase() || "";
    
    return specialization.includes(query) || name.includes(query);
  });

  return (
    <div className="min-h-screen bg-gray-50 md:p-6">
      <div className="max-w-3xl mx-auto bg-white min-h-[90vh] md:rounded-3xl shadow-sm flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Consultations</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Expert medical advice</p>
          </div>
          
          {/* User Profile Avatar */}
          <button 
            onClick={() => navigate('/profile/edit')}
            className="relative group transition-transform active:scale-95"
          >
            <div className="w-12 h-12 rounded-full border-2 border-blue-100 p-0.5 group-hover:border-blue-500 transition-colors">
              {userProfile?.photo_url || userProfile?.photo ? (
                <img 
                  src={userProfile.photo_url || getImageUrl(userProfile.photo)} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FiUser size={20} />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by specialization or name..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none outline-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 animate-pulse">Finding specialists...</p>
            </div>
          ) : (
            <div className="space-y-1 pb-20">
              <AnimatePresence>
                {/* 3. Map over filteredDoctors instead of all doctors */}
                {filteredDoctors.map((doc, index) => {
                  const profile = doc.doctor_profile;
                  const displayName = `Dr. ${doc.username}`;
                  const photoUrl = profile?.photo_url || getImageUrl(profile?.photo);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={doc.id}
                      onClick={() => handleDoctorSelect(doc)}
                      className="flex items-center gap-4 p-4 hover:bg-blue-50/50 cursor-pointer rounded-2xl transition-all group border-b border-gray-50 last:border-0 mx-2"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                          {photoUrl ? (
                            <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-400">
                              <FiActivity size={28} />
                            </div>
                          )}
                        </div>
                        {doc.is_active && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {profile?.specialization && (
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {profile.specialization}
                            </span>
                          )}
                          {profile?.qualification && (
                            <span className="text-[11px] text-gray-400 font-bold border border-gray-200 px-1.5 rounded uppercase">
                              {profile.qualification}
                            </span>
                          )}
                        </div>
                        {profile?.experience_years && (
                          <p className="text-xs text-gray-500 mt-1">
                            {profile.experience_years} years experience
                          </p>
                        )}
                      </div>

                      <div className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                        <FiChevronRight size={24} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* 4. Show a nice message if no doctors match the search */}
              {filteredDoctors.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
                    <FiSearch size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-semibold">
                    {doctors.length === 0 ? "No Doctors Available" : "No matches found"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
                    {doctors.length === 0 
                      ? "We couldn't find any specialists online right now."
                      : `We couldn't find any doctors matching "${searchQuery}".`}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consult;