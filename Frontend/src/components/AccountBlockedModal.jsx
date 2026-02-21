// Frontend/src/components/AccountBlockedModal.jsx
import React, { useEffect, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authslice'; 
import api, { setAccessToken } from '../lib/axios';

const AccountBlockedModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const dispatch = useDispatch();

    useEffect(() => {
        const handleBlockedEvent = () => setIsOpen(true);
        window.addEventListener('account-blocked', handleBlockedEvent);
        return () => window.removeEventListener('account-blocked', handleBlockedEvent);
    }, []);

    useEffect(() => {
        let timer;
        if (isOpen && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isOpen && countdown === 0) {
            
            // --- Call the backend to clear the HttpOnly Cookie ---
            const clearSession = async () => {
                try {
                    // Send request without Bearer token so middleware ignores it entirely
                    await api.post('/api/users/logout/', {}, { 
                        skipLoading: true,
                        headers: { Authorization: null } 
                    });
                } catch (err) {
                    console.error("Failed to call logout", err);
                } finally {
                    // Clear local storage and state
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token'); 
                    localStorage.removeItem('user');
                    
                    dispatch(logout()); 
                    setAccessToken(null);
                    
                    window.location.href = '/login'; 
                }
            };

            clearSession();
        }

        return () => clearInterval(timer);
    }, [isOpen, countdown, dispatch]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mx-auto mb-6">
                    <FiLock className="text-red-500" size={40} />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Account Suspended</h2>
                
                <p className="text-zinc-400 mb-8">
                    Your account has been deactivated by an administrator. You can no longer access this platform.
                </p>
                
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 bg-zinc-950 py-3 rounded-lg border border-zinc-800">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Logging out in {countdown} seconds...
                </div>
            </div>
        </div>
    );
};

export default AccountBlockedModal;