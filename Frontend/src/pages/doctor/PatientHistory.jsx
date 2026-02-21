import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUserCircle } from 'react-icons/fa';
import api from '../../lib/axios';

const PatientHistory = () => {
    const navigate = useNavigate();
    
    // 1. Grab the roomId from the URL (e.g., "user_6_doc_5")
    const { roomId } = useParams(); 
    
    // 2. Extract just the patient ID number from the string
    const patientId = roomId ? roomId.split('_')[1] : null;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatientProfile = async () => {
            if (!patientId) return;
            try {
                setLoading(true);
                setError(null);
                // Fetching the specific patient's profile from your Django backend
                const response = await api.get(`/api/profiles/patient/${patientId}/`);
                setProfile(response.data);
            } catch (err) {
                console.error("Error fetching patient profile:", err);
                setError("Failed to load patient history.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatientProfile();
    }, [patientId]);

    // Helper function to capitalize words
    const formatValue = (val) => {
        if (Array.isArray(val)) return val.join(", ");
        return val ? String(val).charAt(0).toUpperCase() + String(val).slice(1).toLowerCase() : '--';
    };

    return (
        <div className="flex flex-col h-full w-full bg-black font-sans text-white">
            
            {/* Header */}
            <div className="bg-black border-b border-zinc-800 p-4 px-6 flex items-center shrink-0 sticky top-0 z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors mr-4"
                >
                    <FaArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                        Patient History & Profile
                    </h2>
                    <p className="text-xs font-medium text-zinc-500 mt-0.5">
                        Viewing Patient #{patientId}
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-black">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            {error}
                        </div>
                    )}

                    {!loading && !error && profile && (
                        <div className="animate-fade-in-up space-y-8">
                            
                            {/* Profile Header Card */}
                            <div className="p-8 bg-[#0A0A0A] border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                                <div className="w-32 h-32 bg-zinc-900 border-2 border-zinc-800 rounded-full flex items-center justify-center overflow-hidden shrink-0 relative group">
                                    {/* FIXED: Using profile.photo_url as shown in your network response */}
                                    {profile.photo_url || profile.photo ? (
                                        <img 
                                            src={profile.photo_url || profile.photo} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    ) : (
                                        <FaUserCircle size={80} className="text-zinc-700" />
                                    )}
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-3xl font-bold text-white tracking-tighter">{profile.name || `Patient #${patientId}`}</h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                                        <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            {formatValue(profile.gender)} • {profile.age} Years
                                        </span>
                                        <span className="px-3 py-1 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest">
                                            Goal: {formatValue(profile.goal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Physical Metrics */}
                                <div className="p-6 bg-[#0A0A0A] border border-zinc-800 rounded-2xl space-y-5">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Body Metrics</h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                                            <span className="text-sm text-zinc-400 font-medium">Height</span>
                                            <span className="text-lg font-bold">{profile.height ? `${profile.height} cm` : '--'}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                                            <span className="text-sm text-zinc-400 font-medium">Current Weight</span>
                                            <span className="text-lg font-bold text-white">{profile.weight ? `${profile.weight} kg` : '--'}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                                            <span className="text-sm text-zinc-400 font-medium">Target Weight</span>
                                            <span className="text-lg font-bold text-zinc-300">{profile.target_weight ? `${profile.target_weight} kg` : '--'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Macro Goals */}
                                <div className="p-6 bg-[#0A0A0A] border border-zinc-800 rounded-2xl space-y-5">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Daily Targets</h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                                            <span className="text-sm text-zinc-400 font-medium">Calories</span>
                                            <span className="text-lg font-bold text-white">{profile.daily_calorie_goal || '--'} kcal</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                                            <span className="text-sm text-zinc-400 font-medium">Protein</span>
                                            <span className="text-lg font-bold text-zinc-300">{profile.protein_goal || '--'}g</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                                            <span className="text-sm text-zinc-400 font-medium">Carbs / Fat</span>
                                            <span className="text-lg font-bold text-zinc-300">{profile.carbs_goal}g / {profile.fats_goal}g</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Health Context */}
                                <div className="p-6 bg-[#0A0A0A] border border-zinc-800 rounded-2xl space-y-5">
                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Medical Info</h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Conditions</span>
                                            <span className="text-sm font-medium text-white leading-snug">
                                                {formatValue(profile.medical_conditions)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 border-t border-zinc-800/50 pt-3">
                                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Activity Factor</span>
                                            <span className="text-sm font-medium text-white">
                                                {profile.activity_level} ({profile.activity_level > 1.5 ? 'Very Active' : 'Sedentary'})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientHistory;