import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid 
} from 'recharts';
import { 
  Flame, Droplets, Footprints, ChevronRight, 
  TrendingUp, Activity, Apple, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';

// --- Mock Data for other sections (Keep as is for now) ---
const WEEKLY_DATA = [
  { day: 'M', calories: 2100, burn: 400 },
  { day: 'T', calories: 1800, burn: 320 },
  { day: 'W', calories: 2400, burn: 550 },
  { day: 'T', calories: 2000, burn: 450 },
  { day: 'F', calories: 1950, burn: 400 },
  { day: 'S', calories: 2700, burn: 600 },
  { day: 'S', calories: 2200, burn: 300 },
];

const Dashboard = () => {
  const [waterIntake, setWaterIntake] = useState(4); // Glasses
  const waterGoal = 8;
  
  // Weight State
  const [weightData, setWeightData] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [startWeight, setStartWeight] = useState(0); // Assuming first entry is start
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [loadingWeight, setLoadingWeight] = useState(false);

  // Fetch Weight Data
  const fetchWeightData = async () => {
    try {
      const [historyRes, profileRes] = await Promise.all([
        api.get('/api/profiles/weight-history/'),
        api.get('/api/profiles/me/')
      ]);

      // Process History for Graph
      const formattedHistory = historyRes.data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        weight: item.weight,
        fullDate: item.date
      }));
      setWeightData(formattedHistory);

      // Set Current Weight from Profile
      if (profileRes.data.weight) {
        setCurrentWeight(profileRes.data.weight);
      }
      
      // Set Start Weight (First entry in history or current if no history)
      if (formattedHistory.length > 0) {
        setStartWeight(formattedHistory[0].weight);
      } else if (profileRes.data.weight) {
        setStartWeight(profileRes.data.weight);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchWeightData();
  }, []);

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    
    setLoadingWeight(true);
    try {
      await api.post('/api/profiles/weight-history/', { weight: newWeight });
      await fetchWeightData(); // Refresh data
      setShowWeightModal(false);
      setNewWeight('');
    } catch (error) {
      console.error("Error adding weight:", error);
    } finally {
      setLoadingWeight(false);
    }
  };

  // Calculate weight change
  const weightChange = (currentWeight - startWeight).toFixed(1);
  const isWeightLoss = weightChange <= 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-area-pt">
      {/* Header Section */}
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hello, User</h1>
            <p className="text-gray-500 text-sm">Here's your daily breakdown</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-gray-700">U</span>
          </div>
        </div>

        {/* Main Calorie Card */}
        <div className="flex items-center justify-between bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <div className="space-y-1">
            <p className="text-blue-100 text-sm font-medium">Calories Left</p>
            <h2 className="text-4xl font-bold">850</h2>
            <p className="text-xs text-blue-100 opacity-80">Goal: 2,400 kcal</p>
          </div>
          
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-400 opacity-30" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="80" strokeLinecap="round" className="text-white" />
            </svg>
            <Flame className="absolute w-8 h-8 text-white" fill="white" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <MacroCard label="Protein" value="120g" max="180g" color="bg-purple-100 text-purple-600" barColor="bg-purple-500" percent="65%" />
          <MacroCard label="Carbs" value="210g" max="300g" color="bg-orange-100 text-orange-600" barColor="bg-orange-500" percent="70%" />
          <MacroCard label="Fats" value="45g" max="70g" color="bg-yellow-100 text-yellow-600" barColor="bg-yellow-500" percent="60%" />
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-5 space-y-6"
      >
        
        {/* Weekly Activity Graph */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              Weekly Activity
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6', radius: 4 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="calories" fill="#3B82F6" radius={[4, 4, 4, 4]} barSize={8} />
                <Bar dataKey="burn" fill="#93C5FD" radius={[4, 4, 4, 4]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weight Trend Graph with Add Button */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              Weight Journey
            </h3>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isWeightLoss ? 'text-green-600' : 'text-red-500'}`}>
                    {weightChange > 0 ? '+' : ''}{weightChange} kg
                </span>
                <button 
                    onClick={() => setShowWeightModal(true)}
                    className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
          </div>
          
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-800">{currentWeight}</span>
            <span className="text-sm text-gray-500 ml-1">kg</span>
            <span className="text-xs text-gray-400 ml-2">Current</span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  hide={true}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                  labelFormatter={(label) => label}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Water & Steps Row */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="bg-white p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-blue-500">
                <Droplets size={20} fill="currentColor" />
                <span className="font-bold text-gray-700">Water</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800">{waterIntake}</span>
                <span className="text-xs text-gray-500">/ {waterGoal} glasses</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}
                  className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"
                >-</button>
                <button 
                  onClick={() => setWaterIntake(Math.min(waterGoal + 5, waterIntake + 1))}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-md"
                >+</button>
              </div>
            </div>
            {/* Background Decoration */}
            <div className={`absolute bottom-0 left-0 right-0 bg-blue-50 transition-all duration-500 ease-out`} style={{ height: `${(waterIntake / waterGoal) * 100}%`, maxHeight: '100%' }}></div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2 text-orange-500">
              <Footprints size={20} />
              <span className="font-bold text-gray-700">Steps</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-800">4,289</span>
              <p className="text-xs text-gray-500">Goal: 10,000</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </motion.div>
        </div>

      </motion.div>

      {/* Add Weight Modal */}
      <AnimatePresence>
        {showWeightModal && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl relative"
                >
                    <button 
                        onClick={() => setShowWeightModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>

                    <h3 className="text-xl font-bold text-gray-800 mb-1">Update Weight</h3>
                    <p className="text-sm text-gray-500 mb-6">Enter your current weight to track progress.</p>

                    <form onSubmit={handleAddWeight}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder="e.g. 75.5"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    autoFocus
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loadingWeight || !newWeight}
                            className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loadingWeight ? 'Updating...' : 'Save Record'}
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
  <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
    <div className="mb-2">
      <span className="text-sm font-bold text-gray-800">{value}</span>
      <span className="text-[10px] text-gray-400"> / {max}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: percent }}></div>
    </div>
  </div>
);

const MealItem = ({ name, cal, time, icon }) => (
  <div className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-800">{name}</h4>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
    <span className="text-sm font-medium text-gray-600">{cal} kcal</span>
  </div>
);

export default Dashboard;