import React, { useState, useEffect } from 'react';
import { FiTrash2, FiShield, FiAlertTriangle, FiUserCheck, FiUserX, FiRefreshCcw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../lib/axios';

const AdminUserManagement = () => {
    const [activeTab, setActiveTab] = useState('user');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10; // Must match backend page_size

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const tabs = [
        { id: 'user', label: 'Users' },
        { id: 'doctor', label: 'Doctors' },
        { id: 'employee', label: 'Employees' },
        { id: 'deleted', label: 'Deleted Accounts' },
    ];

    const roles = ['user', 'doctor', 'employee', 'admin'];

    // Reset to page 1 whenever the tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Fetch users when tab OR page changes
    useEffect(() => {
        fetchUsers();
    }, [activeTab, currentPage]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Include the page query parameter
            const response = await api.get(`/api/admin/users-management/?role=${activeTab}&page=${currentPage}`);
            
            // Backend now returns { count, next, previous, results }
            setUsers(response.data.results);
            setTotalItems(response.data.count);
            setTotalPages(Math.ceil(response.data.count / pageSize));
            
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // When modifying data, it's best to refetch to keep pagination accurate
    const handleToggleBlock = async (userId) => {
        try {
            await api.patch(`/api/admin/users-management/${userId}/`, { action: 'toggle_block' });
            fetchUsers(); // Refetch to keep page size and counts accurate
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/api/admin/users-management/${userId}/`, {
                action: 'change_role',
                role: newRole
            });
            fetchUsers(); // Refetch
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
            fetchUsers(); // Refetch to update pagination limits
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.error || "Failed to delete user."); 
        } finally {
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

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-zinc-800 mb-6 pb-2 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === tab.id
                                ? tab.id === 'deleted' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
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
                                            <span>Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                                        No {activeTab === 'deleted' ? 'deleted accounts' : activeTab + 's'} found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'deleted' ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 w-fit rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                                    <FiUserX size={14} /> Inactive
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleBlock(user.id)}
                                                    title="Block User"
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                >
                                                    <FiUserCheck size={14} /> Active
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center gap-2">
                                                <FiShield className="text-zinc-500" size={14} />
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    disabled={activeTab === 'deleted'}
                                                    className={`bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none ${activeTab === 'deleted' && 'opacity-50 cursor-not-allowed'}`}
                                                >
                                                    {roles.map(r => (
                                                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {activeTab === 'deleted' ? (
                                                <button
                                                    onClick={() => handleToggleBlock(user.id)}
                                                    className="text-emerald-500 hover:text-emerald-400 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors flex items-center gap-2 ml-auto"
                                                    title="Restore Account"
                                                >
                                                    <FiRefreshCcw size={16} /> <span className="text-xs font-medium">Restore</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => confirmDelete(user)}
                                                    className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination Controls --- */}
                {!loading && totalItems > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/30">
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-zinc-400 px-2">
                                Page <span className="font-medium text-white">{currentPage}</span> of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4 mx-auto">
                            <FiAlertTriangle className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-white text-center mb-2">Suspend Account?</h3>
                        <p className="text-zinc-400 text-sm text-center mb-6">
                            Are you sure you want to deactivate <span className="text-white font-medium">{userToDelete?.username}</span>? 
                            This will restrict their access, but their data will be kept in the deleted accounts tab.
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
                                Yes, Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;