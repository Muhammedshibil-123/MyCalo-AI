import React, { useState, useEffect } from 'react';
import { FiUsers, FiDatabase, FiActivity, FiMessageSquare, FiArrowUpRight } from 'react-icons/fi';
// import api from '../../lib/axios'; // Uncomment when ready to fetch real data

const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="flex flex-col p-6 bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl transition-all hover:border-gray-300 dark:hover:border-zinc-700">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">{title}</h3>
            <Icon className="text-gray-400 dark:text-zinc-500" size={18} />
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-black dark:text-white">{value}</span>
            {trend && (
                <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                    <FiArrowUpRight size={12} className="mr-0.5" />
                    {trend}
                </span>
            )}
        </div>
    </div>
);

const AdminDashboard = () => {
    // Placeholder state - Replace with actual API data
    const [stats, setStats] = useState({
        totalUsers: '1,248',
        totalFoods: '8,430',
        totalExercises: '342',
        activeChats: '24'
    });

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">Overview</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    Monitor your application's metrics and recent activity.
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon={FiUsers} 
                    trend="12%" 
                />
                <StatCard 
                    title="Verified Food Items" 
                    value={stats.totalFoods} 
                    icon={FiDatabase} 
                    trend="4%" 
                />
                <StatCard 
                    title="Exercise Database" 
                    value={stats.totalExercises} 
                    icon={FiActivity} 
                />
                <StatCard 
                    title="Active Consultations" 
                    value={stats.activeChats} 
                    icon={FiMessageSquare} 
                    trend="8%" 
                />
            </div>

            {/* Recent Activity Table (Vercel Style) */}
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-sm font-semibold text-black dark:text-white">Recent System Activity</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-50/50 dark:bg-zinc-900/20">
                            <tr>
                                <th className="px-6 py-3 font-medium">Event</th>
                                <th className="px-6 py-3 font-medium">User/System</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                            {/* Dummy Rows - Map your actual activity logs here */}
                            <tr className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-black dark:text-white">New Food Item Added</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">employee@mycalo.com</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        Pending Verification
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 dark:text-zinc-400">2 mins ago</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-black dark:text-white">User Reported Content</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">user123@gmail.com</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                        Flagged
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 dark:text-zinc-400">15 mins ago</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-black dark:text-white">Doctor Registration</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">dr.smith@hospital.com</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Verified
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 dark:text-zinc-400">1 hour ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;