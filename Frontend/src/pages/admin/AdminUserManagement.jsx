// Frontend/src/pages/admin/AdminUserManagement.jsx
import React, { useState, useEffect } from 'react';
import { FiTrash2, FiShield, FiAlertTriangle, FiUserCheck, FiUserX } from 'react-icons/fi';
import api from '../../lib/axios';

const AdminUserManagement = () => {
    const [activeTab, setActiveTab] = useState('user');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const tabs = [
        { id: 'user', label: 'Users' },
        { id: 'doctor', label: 'Doctors' },
        { id: 'employee', label: 'Employees' },
    ];

    const roles = ['user', 'doctor', 'employee', 'admin'];

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/admin/users-management/?role=${activeTab}`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (userId) => {
        try {
            const response = await api.patch(`/api/admin/users-management/${userId}/`, {
                action: 'toggle_block'
            });
            // Update local state to reflect changes
            setUsers(users.map(u => 
                u.id === userId 
                    ? { ...u, is_active: response.data.is_active, status: response.data.status } 
                    : u
            ));
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await api.patch(`/api/admin/users-management/${userId}/`, {
                action: 'change_role',
                role: newRole
            });
            // Remove user from the current tab list if their role changed to something else
            if (response.data.role !== activeTab) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                setUsers(users.map(u => u.id === userId ? { ...u, role: response.data.role } : u));
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        
        try {
            await api.delete(`/api/admin/users-management/${userToDelete.id}/`);
            
            // Remove user from the table successfully
            setUsers(users.filter(u => u.id !== userToDelete.id));
            
        } catch (error) {
            console.error('Error deleting user:', error);
            // Alert the user if there's a database constraint issue (from our new backend logic)
            const errorMessage = error.response?.data?.error || "Failed to delete user.";
            alert(errorMessage); 
        } finally {
            // ALWAYS close the modal and reset state, even if it fails
            setIsModalOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-white">User Management</h1>
                <p className="mt-1 text-sm text-zinc-400">Manage platform users, doctors, and employees.</p>
            </div>

            {}
            <div className="flex space-x-2 border-b border-zinc-800 mb-6 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === tab.id
                                ? 'bg-zinc-800 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-zinc-300">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/50 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Role Permission</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                                        <div className="animate-pulse flex justify-center items-center space-x-2">
                                            <div className="h-4 w-4 bg-zinc-700 rounded-full"></div>
                                            <span>Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                                        No {activeTab}s found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleBlock(user.id)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    user.is_active 
                                                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                }`}
                                            >
                                                {user.is_active ? <FiUserCheck size={14} /> : <FiUserX size={14} />}
                                                {user.is_active ? 'Active' : 'Blocked'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center gap-2">
                                                <FiShield className="text-zinc-500" size={14} />
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                                                >
                                                    {roles.map(r => (
                                                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => confirmDelete(user)}
                                                className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                                                title="Delete User"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4 mx-auto">
                            <FiAlertTriangle className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-white text-center mb-2">Delete {activeTab}?</h3>
                        <p className="text-zinc-400 text-sm text-center mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{userToDelete?.username}</span>? 
                            This action cannot be undone and will permanently remove their data from the servers.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
