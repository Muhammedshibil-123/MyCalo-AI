import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FiSearch, 
    FiClock, 
    FiCheckCircle, 
    FiChevronRight, 
    FiMessageSquare,
    FiUser
} from 'react-icons/fi';
import api from '../../lib/axios';

const DoctorConsultList = () => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('active'); // 'active' or 'resolved'
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchConsultations();
    }, [statusFilter]);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/chat/doctor-consultations/?status=${statusFilter}`);
            setConsultations(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to load consultations", err);
            setError("Failed to load consultations data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        try {
            if (!timestamp) return '';
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

    // Helper to format the name as requested: "sanu (Patient 2)"
    const getPatientName = (consult) => {
        const pData = consult.patient_data || {};
        const name = pData.first_name || pData.username || 'Unknown';
        return `${name} (Patient ${consult.PatientID})`;
    };

    // Helper to extract the profile picture
    const getPatientPhoto = (consult) => {
        const pData = consult.patient_data || {};
        // Adjust this path based on how your Django serializer returns the profile data
        return pData.profile?.photo || pData.profile_photo || null;
    };

    // Filter consultations based on the search term
    const filteredConsultations = consultations.filter(consult => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const fullName = getPatientName(consult).toLowerCase();
        return fullName.includes(searchLower);
    });

    if (error) {
        return (
            <div className="p-8 min-h-screen bg-black flex items-center justify-center">
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 max-w-md w-full text-center">
                    <p className="font-medium text-sm">{error}</p>
                    <button 
                        onClick={fetchConsultations}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 min-h-screen bg-black animate-in fade-in duration-500 max-w-6xl mx-auto">
            
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Patient Consultations</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Manage and review your patient conversations.
                    </p>
                </div>
            </div>

            {/* Controls: Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by patient name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 sm:text-sm transition-colors"
                    />
                </div>

                {/* Status Tabs */}
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-fit shrink-0">
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            statusFilter === 'active'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        <FiClock size={14} />
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter('resolved')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            statusFilter === 'resolved'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        <FiCheckCircle size={14} />
                        Resolved
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredConsultations.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-[400px]">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                        <FiMessageSquare className="text-zinc-500" size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">No consultations found</h3>
                    <p className="text-sm text-zinc-500">
                        {searchTerm 
                            ? "Try adjusting your search query." 
                            : `There are no ${statusFilter} consultations at the moment.`}
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="divide-y divide-zinc-800/50">
                        {filteredConsultations.map((consult) => {
                            const photo = getPatientPhoto(consult);
                            return (
                                <div 
                                    key={consult.ConsultationID}
                                    onClick={() => navigate(`/doctor/chat/${consult.ConsultationID}`, { 
                                        state: { 
                                            patient: consult.patient_data,
                                            status: consult.Status
                                        } 
                                    })}
                                    className="p-4 flex items-center justify-between hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {photo ? (
                                                <img 
                                                    src={photo} 
                                                    alt="Patient" 
                                                    className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-medium border border-zinc-700">
                                                    <FiUser size={20} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Patient Info & Last Message */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-0.5">
                                                <h4 className="font-medium text-white text-sm truncate">
                                                    {getPatientName(consult)}
                                                </h4>
                                                <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                                                    {formatTime(consult.LastMessageTime)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-400 truncate pr-4">
                                                {consult.LastMessage || "Consultation started."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action/Status Indicator */}
                                    <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-zinc-800/50 ml-4">
                                        <div className="hidden sm:block">
                                            {statusFilter === 'active' ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20">
                                                    Active Session
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-zinc-400/10 px-2 py-1 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-zinc-400/20">
                                                    Resolved
                                                </span>
                                            )}
                                        </div>
                                        <FiChevronRight className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorConsultList;