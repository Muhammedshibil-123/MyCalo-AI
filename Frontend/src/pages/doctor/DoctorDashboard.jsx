import React, { useState, useEffect } from 'react';
import { 
    FiUsers, 
    FiActivity, 
    FiMessageSquare, 
    FiArrowUpRight, 
    FiClipboard,
    FiAlertCircle,
    FiCheckCircle
} from 'react-icons/fi';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, 
    BarChart, Bar, CartesianGrid, Cell
} from 'recharts';
import api from '../../lib/axios';

const StatCard = ({ title, value, icon: Icon, trend, color = 'gray', loading = false }) => {
    const colorClasses = {
        gray: 'text-zinc-400',
        blue: 'text-blue-400',
        green: 'text-green-400',
        purple: 'text-purple-400',
        orange: 'text-orange-400',
        red: 'text-red-400'
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
                        <span className={`flex items-center text-xs font-medium ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                            {trend.startsWith('+') && <FiArrowUpRight size={12} className="mr-0.5" />}
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// Custom tooltip for charts matching Vercel theme
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-xl">
                <p className="text-white text-sm font-semibold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs" style={{ color: entry.color || entry.fill }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const DoctorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        myPatients: '0',
        activeConsultations: '0',
        plansCreated: '0',
        alerts: '0'
    });
    
    const [consultationTrends, setConsultationTrends] = useState([]);
    const [adherenceData, setAdherenceData] = useState([]);
    const [recentPatients, setRecentPatients] = useState([]);

    useEffect(() => {
        fetchDoctorData();
    }, []);

    const fetchDoctorData = async () => {
        setLoading(true);
        try {
            // Replace these with your actual doctor endpoints later
            // For now, if they fail, we fall back to realistic mock data
            const [statsRes, trendsRes, adherenceRes, patientsRes] = await Promise.all([
                api.get('/api/doctor/dashboard-stats').catch(() => ({ data: { patients: 142, active: 18, plans: 856, alerts: 4 } })),
                api.get('/api/doctor/consultation-trends').catch(() => ({ data: null })),
                api.get('/api/doctor/adherence-stats').catch(() => ({ data: null })),
                api.get('/api/doctor/recent-patients').catch(() => ({ data: null }))
            ]);

            setStats({
                myPatients: statsRes.data.patients?.toLocaleString() || '0',
                activeConsultations: statsRes.data.active?.toLocaleString() || '0',
                plansCreated: statsRes.data.plans?.toLocaleString() || '0',
                alerts: statsRes.data.alerts?.toLocaleString() || '0'
            });

            // Realistic Mock Data Fallbacks if API isn't ready
            setConsultationTrends(trendsRes.data || [
                { date: 'Mon', messages: 24, calls: 3 },
                { date: 'Tue', messages: 35, calls: 5 },
                { date: 'Wed', messages: 18, calls: 2 },
                { date: 'Thu', messages: 42, calls: 6 },
                { date: 'Fri', messages: 38, calls: 4 },
                { date: 'Sat', messages: 15, calls: 1 },
                { date: 'Sun', messages: 10, calls: 0 }
            ]);

            setAdherenceData(adherenceRes.data || [
                { category: 'Excellent (>90%)', count: 45 },
                { category: 'Good (70-90%)', count: 65 },
                { category: 'Fair (50-70%)', count: 20 },
                { category: 'Poor (<50%)', count: 12 }
            ]);

            setRecentPatients(patientsRes.data || [
                { id: 1, name: 'Alex Johnson', status: 'Needs Review', lastLog: '2 hours ago', risk: 'high' },
                { id: 2, name: 'Sarah Miller', status: 'On Track', lastLog: '5 hours ago', risk: 'low' },
                { id: 3, name: 'David Chen', status: 'Missed Log', lastLog: '2 days ago', risk: 'medium' },
                { id: 4, name: 'Emma Wilson', status: 'Message Pending', lastLog: '10 mins ago', risk: 'low' }
            ]);

        } catch (error) {
            console.error('Failed to fetch doctor dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Doctor Workspace</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Overview of your patients, consultations, and active alerts.
                </p>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    title="Total Patients" 
                    value={stats.myPatients} 
                    icon={FiUsers} 
                    color="blue"
                    trend="+12 this month"
                    loading={loading}
                />
                <StatCard 
                    title="Active Consultations" 
                    value={stats.activeConsultations} 
                    icon={FiMessageSquare} 
                    color="green"
                    trend="+3 today"
                    loading={loading}
                />
                <StatCard 
                    title="Plans Prescribed" 
                    value={stats.plansCreated} 
                    icon={FiClipboard}
                    color="purple"
                    loading={loading}
                />
                <StatCard 
                    title="Requires Attention" 
                    value={stats.alerts} 
                    icon={FiAlertCircle} 
                    color={stats.alerts > 0 ? "red" : "gray"}
                    loading={loading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Consultation Volume - Area Chart */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-white">Weekly Consultation Volume</h2>
                        <span className="text-xs text-zinc-500">Last 7 Days</span>
                    </div>
                    {loading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={consultationTrends}>
                                    <defs>
                                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: '12px' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#52525b" style={{ fontSize: '12px' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="messages" 
                                        name="Chat Messages"
                                        stroke="#60a5fa" 
                                        fill="url(#colorMessages)" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Patient Adherence - Bar Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Patient Plan Adherence</h2>
                    {loading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={adherenceData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="category" 
                                        type="category" 
                                        stroke="#a1a1aa" 
                                        style={{ fontSize: '11px' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        width={100}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a', opacity: 0.4}} />
                                    <Bar dataKey="count" name="Patients" radius={[0, 4, 4, 0]}>
                                        {adherenceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                index === 0 ? '#34d399' : // Green
                                                index === 1 ? '#60a5fa' : // Blue
                                                index === 2 ? '#fbbf24' : // Yellow
                                                '#f87171' // Red
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Patients Needing Attention / Recent Activity */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Priority Patients</h2>
                        <p className="text-xs text-zinc-400 mt-1">Patients requiring your review or attention</p>
                    </div>
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                        View All
                    </button>
                </div>
                
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-800 rounded animate-pulse" />)}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {recentPatients.map((patient) => (
                            <div key={patient.id} className="p-4 px-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium border border-zinc-700">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white flex items-center gap-2">
                                            {patient.name}
                                            {patient.risk === 'high' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                            {patient.risk === 'medium' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Last activity: {patient.lastLog}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                                        patient.status.includes('Review') || patient.status.includes('Missed') 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : patient.status.includes('Message')
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                                    }`}>
                                        {patient.status}
                                    </span>
                                    <button className="text-zinc-400 hover:text-white transition-colors">
                                        <FiArrowUpRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;