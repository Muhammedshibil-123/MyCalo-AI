import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
  Legend
} from 'recharts';
import { 
  FiActivity, FiTrendingUp, FiPieChart, FiCalendar, 
  FiAward, FiPlus, FiX 
} from 'react-icons/fi';
import { FaFire, FaTint } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import { NavLink } from "react-router-dom";

const Dashboard = () => {
  // Static interactive state
  const [waterIntake, setWaterIntake] = useState(4); 
  const waterGoal = 8;
  
  // Dynamic Data State
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [weightData, setWeightData] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [startWeight, setStartWeight] = useState(0);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [loadingWeight, setLoadingWeight] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, historyRes, analyticsRes] = await Promise.all([
        api.get('/api/profiles/me/'),
        api.get('/api/profiles/weight-history/'),
        api.get('/api/analytics/dashboard/')
      ]);

      setProfile(profileRes.data);
      setAnalytics(analyticsRes.data);

      // Process Weight History
      const formattedHistory = historyRes.data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        weight: item.weight,
        fullDate: item.date
      }));
      setWeightData(formattedHistory);

      if (profileRes.data.weight) setCurrentWeight(profileRes.data.weight);
      
      if (formattedHistory.length > 0) {
        setStartWeight(formattedHistory[0].weight);
      } else if (profileRes.data.weight) {
        setStartWeight(profileRes.data.weight);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    
    setLoadingWeight(true);
    try {
      await api.post('/api/profiles/weight-history/', { weight: newWeight });
      await fetchData(); 
      setShowWeightModal(false);
      setNewWeight('');
    } catch (error) {
      console.error("Error adding weight:", error);
    } finally {
      setLoadingWeight(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derived Data for UI
  const weightChange = (currentWeight - startWeight).toFixed(1);
  const isWeightLoss = weightChange <= 0;
  
  // Extract Weekly Data
  const weeklyMacros = analytics?.seven_days_macros || [];
  
  const totalWeeklyCalories = weeklyMacros.reduce((sum, day) => sum + day.total_calories, 0);
  const totalWeeklyProtein = weeklyMacros.reduce((sum, day) => sum + day.total_protein, 0);
  const totalWeeklyCarbs = weeklyMacros.reduce((sum, day) => sum + day.total_carbs, 0);
  const totalWeeklyFat = weeklyMacros.reduce((sum, day) => sum + day.total_fat, 0);

  const weeklyGoalCalories = (profile?.daily_calorie_goal || 2000) * 7;
  const weeklyGoalProtein = (profile?.protein_goal || 0) * 7;
  const weeklyGoalCarbs = (profile?.carbs_goal || 0) * 7;
  const weeklyGoalFat = (profile?.fats_goal || 0) * 7;

  const weeklyCaloriesLeft = Math.max(0, weeklyGoalCalories - totalWeeklyCalories);
  const weeklyCaloriePercent = Math.min(100, (totalWeeklyCalories / weeklyGoalCalories) * 100);

  // Format Multi-Line Chart Data for Weekly Intake
  const weeklyLineData = weeklyMacros.map(d => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: Math.round(d.total_calories),
    protein: Math.round(d.total_protein),
    carbs: Math.round(d.total_carbs),
    fat: Math.round(d.total_fat)
  }));

  // Format Consistency Data
  const consistencyData = analytics?.consistency_chart.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    consumed: Math.round(d.consumed),
    goal: d.goal
  })) || [];

  // Format Pie Chart Data
  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const mealDist = analytics?.meal_distribution || {};
  const pieData = Object.keys(mealDist)
    .filter(key => mealDist[key] > 0)
    .map((key) => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(),
      value: mealDist[key]
    }));

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-area-pt">
      {/* Header Section */}
      <div className="bg-white p-6 pb-6 rounded-b-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hello, {profile?.name || 'User'}</h1>
            <p className="text-gray-500 text-sm">Your weekly progress overview</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-200">
             {profile?.photo ? (
                  <NavLink to="/profile/edit">
                    <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                  </NavLink>
                 
             ) : (
                 <span className="text-xl font-bold text-blue-700">{profile?.name?.charAt(0) || 'U'}</span>
             )}
          </div>
        </div>

        {/* Main Weekly Calorie Card */}
        <div className="flex items-center justify-between bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
          <div className="space-y-1">
            <p className="text-blue-100 text-sm font-medium">Weekly Calories Left</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">{Math.round(weeklyCaloriesLeft)}</h2>
            <p className="text-sm text-blue-100 opacity-90 mt-1">Consumed: <span className="font-bold">{Math.round(totalWeeklyCalories)}</span> / {weeklyGoalCalories}</p>
          </div>
          
          <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
              <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-400 opacity-30" />
              <circle 
                cx="50%" cy="50%" r="42%" 
                stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray="264" /* Approximated circumference */
                strokeDashoffset={264 - (weeklyCaloriePercent / 100) * 264} 
                strokeLinecap="round" 
                className="text-white transition-all duration-1000 ease-out" 
              />
            </svg>
            <FaFire className="absolute w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
          </div>
        </div>

        {/* Quick Weekly Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
          <MacroCard label="Weekly Protein" value={`${Math.round(totalWeeklyProtein)}g`} max={`${weeklyGoalProtein}g`} color="bg-purple-100 text-purple-600" barColor="bg-purple-500" percent={`${Math.min(100, (totalWeeklyProtein / (weeklyGoalProtein || 1)) * 100)}%`} />
          <MacroCard label="Weekly Carbs" value={`${Math.round(totalWeeklyCarbs)}g`} max={`${weeklyGoalCarbs}g`} color="bg-orange-100 text-orange-600" barColor="bg-orange-500" percent={`${Math.min(100, (totalWeeklyCarbs / (weeklyGoalCarbs || 1)) * 100)}%`} />
          <MacroCard label="Weekly Fats" value={`${Math.round(totalWeeklyFat)}g`} max={`${weeklyGoalFat}g`} color="bg-yellow-100 text-yellow-600" barColor="bg-yellow-500" percent={`${Math.min(100, (totalWeeklyFat / (weeklyGoalFat || 1)) * 100)}%`} />
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-5 space-y-6">
        
        {/* Weekly Activity Graph (Multi-line) */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FiActivity size={18} className="text-blue-500" />
              Weekly Intake Breakdown
            </h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">7 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} dy={10} />
                
                {/* Left Axis for Calories */}
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                
                {/* Right Axis for Macros (Protein, Carbs, Fat) */}
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
                
                <Line yAxisId="left" type="monotone" name="Calories (kcal)" dataKey="calories" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" name="Protein (g)" dataKey="protein" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" name="Carbs (g)" dataKey="carbs" stroke="#F97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" name="Fat (g)" dataKey="fat" stroke="#EAB308" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 30-Day Consistency Chart */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FiCalendar size={18} className="text-indigo-500" />
              Consistency Log
            </h3>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">30 Days</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consistencyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" hide={true} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="consumed" stroke="#6366F1" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="goal" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meal Distribution Pie Chart */}
            <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiPieChart size={18} className="text-amber-500" />
                    Meal Distribution
                    </h3>
                </div>
                {pieData.length > 0 ? (
                    <div className="h-48 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${Math.round(value)} kcal`} />
                        </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 text-[10px] font-medium text-gray-500">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No meal data for this week</div>
                )}
            </motion.div>

            {/* Weight Trend Graph */}
            <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiTrendingUp size={18} className="text-emerald-500" />
                        Weight Journey
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold bg-gray-50 px-2 py-1 rounded-md ${isWeightLoss ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {weightChange > 0 ? '+' : ''}{weightChange} kg
                            </span>
                            <button onClick={() => setShowWeightModal(true)} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors shadow-sm">
                                <FiPlus size={18} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="mb-2">
                        <span className="text-3xl font-black text-gray-800">{currentWeight}</span>
                        <span className="text-sm font-medium text-gray-500 ml-1">kg</span>
                        <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded ml-2 uppercase tracking-wide">Current</span>
                    </div>
                </div>

                <div className="h-32 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                        <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                        <XAxis dataKey="date" hide={true} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide={true} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                            formatter={(value) => [`${value} kg`, 'Weight']} 
                            labelFormatter={(label) => label} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#10B981" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorWeight)" 
                            activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 3 }} 
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>

        {/* Water & Streak Row */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 text-blue-500">
                <FaTint size={18} fill="currentColor" />
                <span className="font-bold text-gray-700">Water</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-800">{waterIntake}</span>
                <span className="text-sm font-medium text-gray-500">/ {waterGoal}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm text-blue-600 flex items-center justify-center hover:bg-blue-50 shadow-sm transition-all active:scale-95"><FiX size={16} /></button>
                <button onClick={() => setWaterIntake(Math.min(waterGoal + 5, waterIntake + 1))} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-md transition-all active:scale-95"><FiPlus size={16} /></button>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 bg-blue-50/80 transition-all duration-700 ease-in-out`} style={{ height: `${(waterIntake / waterGoal) * 100}%`, maxHeight: '100%' }}></div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-orange-400 to-rose-500 p-5 rounded-2xl shadow-sm text-white flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 mb-2 text-white/90">
                <FiAward size={20} />
                <span className="font-bold">Streak Log</span>
                </div>
                <p className="text-orange-100 text-xs font-medium leading-tight">Consecutive days you hit your tracking goals.</p>
            </div>
            <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-black">{analytics?.streak_completed_days || 0}</span>
                <span className="text-sm font-medium text-orange-100">Days</span>
            </div>
          </motion.div>
        </div>

      </motion.div>

      {/* Add Weight Modal */}
      <AnimatePresence>
        {showWeightModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm rounded-3xl p-7 shadow-2xl relative">
                    <button onClick={() => setShowWeightModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2 transition-colors">
                        <FiX size={20} />
                    </button>

                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <FiTrendingUp size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Log Weight</h3>
                    <p className="text-sm text-gray-500 mb-6">Enter your current weight to keep your progress chart up to date.</p>

                    <form onSubmit={handleAddWeight}>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                            <div className="relative">
                                <input 
                                    type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder="e.g. 75.5"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-xl font-bold text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
                                    autoFocus
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                            </div>
                        </div>

                        <button type="submit" disabled={loadingWeight || !newWeight} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-emerald-200">
                            {loadingWeight ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Updating...
                                </span>
                            ) : 'Save Record'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components
const MacroCard = ({ label, value, max, color, barColor, percent }) => (
  <div className="bg-gray-50/80 backdrop-blur border border-gray-100 rounded-2xl p-3 md:p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-2 md:mb-3">
      <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md ${color}`}>{label}</span>
    </div>
    <div className="mb-2 md:mb-3">
      <div className="text-base md:text-lg font-black text-gray-800 leading-none">{value}</div>
      <div className="text-[10px] md:text-[11px] font-medium text-gray-400 mt-1">Target: {max}</div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 overflow-hidden">
      <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: percent }}></div>
    </div>
  </div>
);

export default Dashboard;