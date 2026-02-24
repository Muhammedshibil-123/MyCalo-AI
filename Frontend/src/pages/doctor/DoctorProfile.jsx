import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserCircle, FaCamera, FaEdit, FaSave, FaStethoscope, FaUserMd } from 'react-icons/fa';
import api from '../../lib/axios';


const DoctorProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    // Form State tailored for Doctor fields
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        qualification: '',
        experience_years: '',
        bio: '',
        contact_email: '',
        clinic_address: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Dynamic endpoint detects role and returns DoctorProfile data
            const response = await api.get('/api/profiles/manage/');
            setProfile(response.data);
            setFormData({
                name: response.data.name || '',
                specialization: response.data.specialization || '',
                qualification: response.data.qualification || '',
                experience_years: response.data.experience_years || '',
                bio: response.data.bio || '',
                contact_email: response.data.contact_email || '',
                clinic_address: response.data.clinic_address || ''
            });
            setPreviewUrl(response.data.photo_url || response.data.photo);
        } catch (err) {
            setError("Failed to load medical profile.");
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
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (selectedFile) data.append('photo', selectedFile);

            await api.patch('/api/profiles/manage/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
       
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
           
            console.error(err);
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
                        <h2 className="text-base font-semibold text-white tracking-tight italic">Doctor Credentials</h2>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">Verified Medical Profile</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        isEditing ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                >
                    {isEditing ? <><FaSave /> Save Profile</> : <><FaEdit /> Modify Profile</>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-black">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {loading ? (
                        <div className="flex justify-center py-24">
                            <div className="w-10 h-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up space-y-8">
                            
                            {/* Medical Identity Card */}
                            <div className="p-10 bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12">
                                    <FaStethoscope size={250} />
                                </div>

                                <div className="relative group shrink-0">
                                    <div className="w-44 h-44 bg-zinc-900 border-4 border-zinc-800 rounded-3xl flex items-center justify-center overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Doctor" className="w-full h-full object-cover -rotate-3 group-hover:rotate-0 transition-transform duration-500" />
                                        ) : (
                                            <FaUserMd size={100} className="text-zinc-800" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <label className="absolute -bottom-2 -right-2 p-3.5 bg-blue-600 text-white rounded-2xl cursor-pointer hover:scale-110 transition-transform shadow-2xl z-20">
                                            <FaCamera size={18} />
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    )}
                                </div>

                                <div className="text-center md:text-left flex-1 z-10">
                                    {isEditing ? (
                                        <input 
                                            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-5 py-3 text-3xl font-black w-full focus:border-blue-500 outline-none transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Full Name (e.g. Dr. Smith)"
                                        />
                                    ) : (
                                        <h3 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                                            {profile.name || "Medical Professional"}
                                        </h3>
                                    )}
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                                        <span className="px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">
                                            {profile.specialization || 'General Practice'}
                                        </span>
                                        <span className="px-5 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.25em]">
                                            {profile.experience_years || '0'} Years Exp.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* Left: Clinical Details */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="p-10 bg-[#0A0A0A] border border-zinc-800 rounded-[2rem] space-y-8">
                                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Professional Background</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <DetailField label="Medical Specialization" value={formData.specialization} isEditing={isEditing} onChange={(val) => setFormData({...formData, specialization: val})} />
                                            <DetailField label="Highest Qualification" value={formData.qualification} isEditing={isEditing} onChange={(val) => setFormData({...formData, qualification: val})} />
                                            <DetailField label="Years of Experience" value={formData.experience_years} isEditing={isEditing} type="number" onChange={(val) => setFormData({...formData, experience_years: val})} />
                                            <DetailField label="Contact Email" value={formData.contact_email} isEditing={isEditing} type="email" onChange={(val) => setFormData({...formData, contact_email: val})} />
                                        </div>
                                        
                                        <div className="pt-4 border-t border-zinc-800/50">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3 block">Professional Bio</span>
                                            {isEditing ? (
                                                <textarea 
                                                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm w-full h-32 focus:border-blue-500 outline-none transition-all resize-none"
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                                    placeholder="Describe your expertise..."
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-zinc-400 leading-relaxed italic">
                                                    "{profile.bio || 'No bio provided yet.'}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Clinic Address */}
                                <div className="p-10 bg-[#0A0A0A] border border-zinc-800 rounded-[2rem] space-y-6 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Clinic Location</h4>
                                        {isEditing ? (
                                            <textarea 
                                                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm w-full h-48 focus:border-blue-500 outline-none transition-all resize-none"
                                                value={formData.clinic_address}
                                                onChange={(e) => setFormData({...formData, clinic_address: e.target.value})}
                                                placeholder="Enter full clinic address..."
                                            />
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-5 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-sm font-bold text-white leading-relaxed">
                                                        {profile.clinic_address || 'Clinic address not listed.'}
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-zinc-600 font-medium italic">
                                                    * This address is visible to patients during consultation booking.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {isEditing && (
                                <div className="flex justify-center gap-6 animate-fade-in pb-10">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="px-10 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
                                    >
                                        Discard Changes
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

// Reusable Medical Detail Field
const DetailField = ({ label, value, isEditing, onChange, type = "text" }) => (
    <div className="flex flex-col gap-2">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
        {isEditing ? (
            <input 
                type={type}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm focus:border-blue-500 outline-none transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        ) : (
            <span className="text-sm font-bold text-zinc-100">{value || '--'}</span>
        )}
    </div>
);

export default DoctorProfile;