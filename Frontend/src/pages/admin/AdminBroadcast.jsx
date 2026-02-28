import React, { useState } from 'react';
import { FiRadio, FiSend, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import api from '../../lib/axios';

const AdminBroadcast = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !message.trim()) {
            setStatus({ type: 'error', text: 'Please provide both a title and a message.' });
            return;
        }

        const isConfirmed = window.confirm("Are you sure you want to send this notification to all active users?");
        if (!isConfirmed) return;

        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            // Get token from localStorage (Change 'access' to 'token' or whatever key you use to store the JWT)
            const token = localStorage.getItem('access') || localStorage.getItem('token');

            // Force Axios to send the request EXACTLY like Postman
            await api.post('/api/admin/broadcast/', 
                // 1. The Body (JSON)
                {
                    title: title.trim(),
                    message: message.trim()
                },
                // 2. The Headers Configuration
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    }
                }
            );
            
            setStatus({ type: 'success', text: 'Broadcast notification has been queued successfully!' });
            setTitle('');
            setMessage('');
        } catch (error) {
            console.error('Broadcast error:', error);
            setStatus({ 
                type: 'error', 
                text: error.response?.data?.error || 'Failed to send broadcast. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FiRadio className="text-blue-400" size={24} />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Broadcast System</h1>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                    Send push notifications to all active users across the platform. Use this for important announcements, updates, or offers.
                </p>
            </div>

            {/* Main Form Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                    <FiInfo className="text-zinc-400" size={16} />
                    <h2 className="text-sm font-semibold text-white">Compose Message</h2>
                </div>

                <div className="p-6">
                    {/* Status Message */}
                    {status.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${
                            status.type === 'success' 
                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                            {status.type === 'success' ? (
                                <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
                            ) : (
                                <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                            )}
                            <p className="text-sm font-medium">{status.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleSendBroadcast} className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                                Notification Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Special Offer! Free Premium Today"
                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                maxLength={65}
                                disabled={loading}
                            />
                            <p className="mt-2 text-xs text-zinc-500 text-right">
                                {title.length}/65 characters
                            </p>
                        </div>

                        {/* Message Input */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-2">
                                Notification Body
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your broadcast message here..."
                                rows={5}
                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                maxLength={240}
                                disabled={loading}
                            />
                            <p className="mt-2 text-xs text-zinc-500 text-right">
                                {message.length}/240 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-zinc-800">
                            <button
                                type="submit"
                                disabled={loading || !title.trim() || !message.trim()}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <FiSend size={16} />
                                        Send Broadcast to All Users
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Info Box */}
            <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-start gap-3">
                 <FiInfo className="text-zinc-400 mt-0.5 shrink-0" size={16} />
                 <div className="text-sm text-zinc-400 space-y-1">
                     <p className="font-medium text-zinc-300">How broadcasts work</p>
                     <p>Messages are sent asynchronously via a background task to ensure platform stability. It may take a few minutes for all users to receive the notification depending on the user base size.</p>
                 </div>
            </div>
        </div>
    );
};

export default AdminBroadcast;