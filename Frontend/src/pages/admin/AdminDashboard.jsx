import React, { useState, useEffect } from 'react';
import { FiUsers, FiDatabase, FiActivity, FiMessageSquare, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import api from '../../lib/axios';

const StatCard = ({ title, value, icon: Icon, trend, color = 'gray', loading = false }) => {
    const colorClasses = {
        gray: 'text-zinc-400',
        blue: 'text-blue-400',
        green: 'text-green-400',
        purple: 'text-purple-400',
        orange: 'text-orange-400',
    };

    return (
        <div className="flex flex-col p-6 bg-zinc-900 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700 group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
                <Icon className={`${colorClasses[color]} transition-transform group-hover:scale-110`} size={18} />
            </div>
            {loading ? (
                <div className="h-10 bg-zinc-800 rounded animate-pulse" />
            ) : (
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
                    {trend && (
                        <span className="flex items-center text-xs font-medium text-green-400">
                            <FiArrowUpRight size={12} className="mr-0.5" />
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: '0',
        totalDoctors: '0',
        totalEmployees: '0',
        totalFoods: '0',
        totalExercises: '0',
        activeChats: '0'
    });
    const [foodSourceData, setFoodSourceData] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [topFoods, setTopFoods] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [usersRes, foodsRes, exercisesRes, chatsRes, foodSourceRes, growthRes, topFoodsRes] = await Promise.all([
                api.get('/api/admin/users-count').catch(() => ({ data: { total: 0, doctors: 0, employees: 0 } })),
                api.get('/api/admin/foods-count').catch(() => ({ data: { count: 0 } })),
                api.get('/api/admin/exercises-count').catch(() => ({ data: { count: 0 } })),
                api.get('/api/admin/active-chats').catch(() => ({ data: { count: 0 } })),
                api.get('/api/admin/food-source-distribution').catch(() => ({ data: [] })),
                api.get('/api/admin/platform-growth').catch(() => ({ data: [] })),
                api.get('/api/admin/top-foods').catch(() => ({ data: [] }))
            ]);

            setStats({
                totalUsers: usersRes.data.total?.toLocaleString() || '0',
                totalDoctors: usersRes.data.doctors?.toLocaleString() || '0',
                totalEmployees: usersRes.data.employees?.toLocaleString() || '0',
                totalFoods: foodsRes.data.count?.toLocaleString() || '0',
                totalExercises: exercisesRes.data.count?.toLocaleString() || '0',
                activeChats: chatsRes.data.count?.toLocaleString() || '0'
            });

            setFoodSourceData(foodSourceRes.data);
            setGrowthData(growthRes.data);
            setTopFoods(topFoodsRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Colors for charts
    const COLORS = {
        AI: '#60a5fa',      // blue-400
        USER: '#34d399',    // green-400
        ADMIN: '#a78bfa',   // purple-400
        UNKNOWN: '#71717a'  // zinc-500
    };

    const ROLE_COLORS = {
        user: '#60a5fa',     // blue-400
        doctor: '#34d399',   // green-400
        employee: '#a78bfa', // purple-400
        admin: '#fb923c'     // orange-400
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-xl">
                    <p className="text-white text-sm font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Monitor your application's metrics and user activity.
                </p>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon={FiUsers} 
                    color="blue"
                    loading={loading}
                />
                <StatCard 
                    title="Registered Doctors" 
                    value={stats.totalDoctors} 
                    icon={FiUsers} 
                    color="green"
                    loading={loading}
                />
                <StatCard 
                    title="Employees" 
                    value={stats.totalEmployees} 
                    icon={FiUsers}
                    color="purple"
                    loading={loading}
                />
                <StatCard 
                    title="Active Consultations" 
                    value={stats.activeChats} 
                    icon={FiMessageSquare} 
                    color="orange"
                    loading={loading}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <StatCard 
                    title="Food Database" 
                    value={stats.totalFoods} 
                    icon={FiDatabase} 
                    color="green"
                    loading={loading}
                />
                <StatCard 
                    title="Exercise Database" 
                    value={stats.totalExercises} 
                    icon={FiActivity}
                    color="purple"
                    loading={loading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* Food Source Distribution - Doughnut Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">
                        AI vs. Manual vs Admin Logging Distribution
                    </h2>
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    ) : foodSourceData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={foodSourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="count"
                                        label={(entry) => `${entry.source}: ${entry.count}`}
                                    >
                                        {foodSourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.source] || COLORS.UNKNOWN} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                                        formatter={(value, entry) => (
                                            <span style={{ color: '#a1a1aa' }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-zinc-600">
                            <p className="text-sm">No data available</p>
                        </div>
                    )}
                </div>

                {/* Platform Growth & Role Demographics - Area Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">
                        Platform Growth & Role Demographics
                    </h2>
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    ) : growthData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={ROLE_COLORS.user} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={ROLE_COLORS.user} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDoctor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={ROLE_COLORS.doctor} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={ROLE_COLORS.doctor} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorEmployee" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={ROLE_COLORS.employee} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={ROLE_COLORS.employee} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#52525b" 
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis 
                                        stroke="#52525b" 
                                        style={{ fontSize: '12px' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        wrapperStyle={{ fontSize: '12px' }}
                                        formatter={(value) => (
                                            <span style={{ color: '#a1a1aa', textTransform: 'capitalize' }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="user" 
                                        stackId="1"
                                        stroke={ROLE_COLORS.user} 
                                        fill="url(#colorUser)" 
                                        strokeWidth={2}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="doctor" 
                                        stackId="1"
                                        stroke={ROLE_COLORS.doctor} 
                                        fill="url(#colorDoctor)" 
                                        strokeWidth={2}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="employee" 
                                        stackId="1"
                                        stroke={ROLE_COLORS.employee} 
                                        fill="url(#colorEmployee)" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-zinc-600">
                            <p className="text-sm">No data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Consumed Native Foods Leaderboard */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-sm font-semibold text-white">Top Consumed Native Foods</h2>
                    <p className="text-xs text-zinc-400 mt-1">Most popular food items tracked by users</p>
                </div>
                {loading ? (
                    <div className="p-6">
                        <div className="space-y-3">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : topFoods.length > 0 ? (
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topFoods} layout="vertical">
                                <XAxis type="number" stroke="#52525b" style={{ fontSize: '12px' }} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    stroke="#52525b" 
                                    style={{ fontSize: '12px' }}
                                    width={150}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="consumption_count" fill="#60a5fa" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        
                        {/* Detailed List */}
                        <div className="mt-6 space-y-3">
                            {topFoods.map((food, index) => (
                                <div key={food.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-zinc-700 text-zinc-400'
                                        }`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{food.name}</p>
                                            <p className="text-zinc-400 text-xs">
                                                {food.calories} kcal • {food.source}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{food.consumption_count}</p>
                                        <p className="text-zinc-400 text-xs">logs</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-zinc-600">
                        <FiDatabase size={48} className="mx-auto mb-4 text-zinc-700" />
                        <p className="text-sm">No consumption data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;