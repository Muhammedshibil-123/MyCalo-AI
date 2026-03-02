import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserCircle, FaCamera, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import api from '../../lib/axios';


const AdminProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        designation: '',
        employee_id: '',
        education: '',
        joining_date: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/profiles/manage/');
            setProfile(response.data);
            setFormData({
                name: response.data.name || '',
                department: response.data.department || '',
                designation: response.data.designation || '',
                employee_id: response.data.employee_id || '',
                education: response.data.education || '',
                joining_date: response.data.joining_date || ''
            });
            setPreviewUrl(response.data.photo_url || response.data.photo);
        } catch (err) {
            setError("Failed to load profile details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            const data = new FormData();
            
            // SAFETY CHECK: Only append fields that actually have data
            // This prevents sending empty strings ("") to Django DateFields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    data.append(key, formData[key]);
                }
            });
            
            // ONLY append photo if a NEW file was actually selected
            if (selectedFile) {
                data.append('photo', selectedFile);
            }

            await api.patch('/api/profiles/manage/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-black font-sans text-white">
            
            {/* Header */}
            <div className="bg-black border-b border-zinc-800 p-4 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors mr-4"
                    >
                        <FaArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="text-base font-semibold text-white tracking-tight">Staff Profile</h2>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">Management & Credentials</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                        isEditing ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                >
                    {isEditing ? <><FaSave /> Save Changes</> : <><FaEdit /> Edit Profile</>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-black">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up space-y-8">
                            
                            {/* Profile Identity Card */}
                            <div className="p-8 bg-[#0A0A0A] border border-zinc-800 rounded-3xl flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                                

                                <div className="relative group">
                                    <div className="w-40 h-40 bg-zinc-900 border-4 border-zinc-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <FaUserCircle size={100} className="text-zinc-800" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <label className="absolute bottom-2 right-2 p-3 bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xl">
                                            <FaCamera size={16} />
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    )}
                                </div>

                                <div className="text-center md:text-left flex-1">
                                    {isEditing ? (
                                        <input 
                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-2xl font-bold w-full focus:border-white outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Your Name"
                                        />
                                    ) : (
                                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                                            {profile.name || "Staff Member"}
                                        </h3>
                                    )}
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                                        <span className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                            ID: {profile.employee_id || 'N/A'}
                                        </span>
                                        <span className="px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                            {profile.designation || 'Staff'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Professional Info */}
                                <div className="p-8 bg-[#0A0A0A] border border-zinc-800 rounded-3xl space-y-6">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Work Details</h4>
                                    
                                    <div className="space-y-6">
                                        <DetailField 
                                            label="Department" 
                                            value={formData.department} 
                                            isEditing={isEditing}
                                            onChange={(val) => setFormData({...formData, department: val})}
                                        />
                                        <DetailField 
                                            label="Designation" 
                                            value={formData.designation} 
                                            isEditing={isEditing}
                                            onChange={(val) => setFormData({...formData, designation: val})}
                                        />
                                        <DetailField 
                                            label="Employee ID" 
                                            value={formData.employee_id} 
                                            isEditing={isEditing}
                                            onChange={(val) => setFormData({...formData, employee_id: val})}
                                        />
                                    </div>
                                </div>

                                {/* Education & Tenure */}
                                <div className="p-8 bg-[#0A0A0A] border border-zinc-800 rounded-3xl space-y-6">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Background</h4>
                                    
                                    <div className="space-y-6">
                                        <DetailField 
                                            label="Education" 
                                            value={formData.education} 
                                            isEditing={isEditing}
                                            onChange={(val) => setFormData({...formData, education: val})}
                                        />
                                        <DetailField 
                                            label="Joining Date" 
                                            value={formData.joining_date} 
                                            isEditing={isEditing}
                                            type="date"
                                            onChange={(val) => setFormData({...formData, joining_date: val})}
                                        />
                                    </div>
                                </div>

                            </div>

                            {isEditing && (
                                <div className="flex justify-center gap-4 animate-fade-in">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Reusable Sub-component for fields
const DetailField = ({ label, value, isEditing, onChange, type = "text" }) => (
    <div className="flex flex-col gap-2">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
        {isEditing ? (
            <input 
                type={type}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-colors"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        ) : (
            <span className="text-sm font-semibold text-zinc-200">{value || '--'}</span>
        )}
    </div>
);

export default AdminProfile;