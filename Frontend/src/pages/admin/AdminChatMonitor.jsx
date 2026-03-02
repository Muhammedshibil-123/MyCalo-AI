import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiMessageSquare, FiChevronRight, FiArrowLeft, FiClock, FiCheckCircle } from 'react-icons/fi';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

const AdminChatMonitor = () => {
    // State for Doctor List
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the Selected Doctor's Consultations
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);

    // 1. Fetch all doctors on mount
    useEffect(() => {
        fetchDoctors();
    }, []);

    // 2. Fetch consultations whenever a doctor is selected
    useEffect(() => {
        if (selectedDoctor) {
            fetchConsultations(selectedDoctor.id);
        }
    }, [selectedDoctor]);

    const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
            const response = await api.get('/api/users/doctors/');
            setDoctors(response.data);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const fetchConsultations = async (doctorId) => {
        setLoadingConsultations(true);
        try {
            // Fetching from the new admin endpoint you created
            const response = await api.get(`/chat/admin/doctor-consultations/${doctorId}/`);
            setConsultations(response.data);
        } catch (error) {
            console.error('Failed to fetch consultations:', error);
        } finally {
            setLoadingConsultations(false);
        }
    };

    // Filter doctors based on search term
    const filteredDoctors = doctors.filter(doc => {
        const name = doc.doctor_profile?.name || doc.username;
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Format date helper
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    // ==========================================
    // VIEW 2: CONSULTATION LIST FOR A DOCTOR
    // ==========================================
    if (selectedDoctor) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in slide-in-from-right-4 duration-300">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setSelectedDoctor(null)}
                        className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-4 group"
                    >
                        <FiArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                        Back to Doctors
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                            {selectedDoctor.doctor_profile?.photo_url ? (
                                <img src={selectedDoctor.doctor_profile.photo_url} alt="Doctor" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-500"><FiUsers size={24} /></div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-white">
                                {selectedDoctor.doctor_profile?.name ? `Dr. ${selectedDoctor.doctor_profile.name}'s Chats` : `${selectedDoctor.username}'s Chats`}
                            </h1>
                            <p className="text-sm text-zinc-400">
                                Viewing active and resolved patient consultations
                            </p>
                        </div>
                    </div>
                </div>

                {/* Consultations List */}
                {loadingConsultations ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : consultations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {consultations.map((chat) => (
                            <div
                                key={chat.ConsultationID}
                                className="flex flex-col p-5 bg-zinc-900 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700 group cursor-pointer"
                                onClick={() => navigate(`/admin/chat/${chat.ConsultationID}`)} // Add this
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-semibold border border-blue-500/20">
                                            {chat.patient_data?.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium text-sm">
                                                {chat.patient_data?.username || `Patient ID: ${chat.PatientID}`}
                                            </h3>
                                            <div className="flex items-center text-xs text-zinc-500 mt-0.5">
                                                <FiClock className="mr-1" size={10} />
                                                {formatDate(chat.LastMessageTime)}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${chat.Status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                        {chat.Status === 'active' ? <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> : <FiCheckCircle size={10} />}
                                        {chat.Status}
                                    </div> */}
                                </div>

                                <div className="mt-auto bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                                    <p className="text-sm text-zinc-300 truncate">
                                        <span className="text-zinc-500 mr-2 text-xs">Last Msg:</span>
                                        {chat.LastMessage || "Attachment/File"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <FiMessageSquare size={48} className="text-zinc-700 mb-4" />
                        <p className="text-zinc-400 text-sm">This doctor has no recorded consultations yet.</p>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // VIEW 1: DOCTOR LIST
    // ==========================================
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Chat Monitor</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Select a doctor to monitor their active and resolved patient consultations.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search doctors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Doctors Grid */}
            {loadingDoctors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl h-40 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-zinc-800 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                                    <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
                                </div>
                            </div>
                            <div className="h-10 bg-zinc-800 rounded mt-4"></div>
                        </div>
                    ))}
                </div>
            ) : filteredDoctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doc) => (
                        <div
                            key={doc.id}
                            // SWITCH VIEW ON CLICK
                            onClick={() => setSelectedDoctor(doc)}
                            className="flex flex-col p-6 bg-zinc-900 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700 hover:bg-zinc-800/50 cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
                                        {doc.doctor_profile?.photo_url ? (
                                            <img
                                                src={doc.doctor_profile.photo_url}
                                                alt={doc.username}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-zinc-500">
                                                <FiUsers size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                            {doc.doctor_profile?.name ? `Dr. ${doc.doctor_profile.name}` : doc.username}
                                        </h3>
                                        <p className="text-sm text-zinc-400 truncate">
                                            {doc.doctor_profile?.specialization || 'General Practitioner'}
                                        </p>
                                    </div>
                                </div>
                                
                            </div>

                            <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between text-sm">
                                <div className="text-zinc-500 truncate pr-4 text-xs">
                                    {doc.email}
                                </div>
                                <div className="flex items-center text-zinc-400 group-hover:text-white transition-colors font-medium">
                                    <FiMessageSquare className="mr-2 text-blue-400" size={16} />
                                    <span>View Chats</span>
                                    <FiChevronRight className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <FiUsers size={48} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-400 text-sm">No doctors found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default AdminChatMonitor;