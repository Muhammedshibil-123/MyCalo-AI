import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid 
} from 'recharts';
import { 
  Flame, Droplets, Footprints, ChevronRight, 
  TrendingUp, Activity, Apple 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Mock Data (Replace with API data later) ---
const WEEKLY_DATA = [
  { day: 'M', calories: 2100, burn: 400 },
  { day: 'T', calories: 1800, burn: 320 },
  { day: 'W', calories: 2400, burn: 550 },
  { day: 'T', calories: 2000, burn: 450 },
  { day: 'F', calories: 1950, burn: 400 },
  { day: 'S', calories: 2700, burn: 600 },
  { day: 'S', calories: 2200, burn: 300 },
];

const WEIGHT_DATA = [
  { date: '1', weight: 78.5 },
  { date: '5', weight: 78.2 },
  { date: '10', weight: 77.8 },
  { date: '15', weight: 77.5 },
  { date: '20', weight: 77.1 },
  { date: '25', weight: 76.8 },
];

const Dashboard = () => {
  const [waterIntake, setWaterIntake] = useState(4); // Glasses
  const waterGoal = 8;

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
            <h1 className="text-2xl font-bold text-gray-800">Hello, Muhammed</h1>
            <p className="text-gray-500 text-sm">Here's your daily breakdown</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-gray-700">M</span>
          </div>
        </div>

        {/* Main Calorie Card - Mobile Optimized Ring */}
        <div className="flex items-center justify-between bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <div className="space-y-1">
            <p className="text-blue-100 text-sm font-medium">Calories Left</p>
            <h2 className="text-4xl font-bold">850</h2>
            <p className="text-xs text-blue-100 opacity-80">Goal: 2,400 kcal</p>
          </div>
          
          <div className="relative w-24 h-24 flex items-center justify-center">
             {/* Simple SVG Ring Implementation */}
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

        {/* Weight Trend Graph */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              Weight Journey
            </h3>
            <span className="text-sm font-bold text-green-600">-1.7 kg</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEIGHT_DATA}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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

        {/* Recent Meals Section */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="font-bold text-gray-800">Recent Meals</h3>
            <button className="text-blue-600 text-xs font-medium flex items-center">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
             <MealItem name="Oatmeal & Berries" cal="320" time="08:30 AM" icon={<Apple size={16} />} />
             <MealItem name="Grilled Chicken Salad" cal="450" time="01:15 PM" icon={<Flame size={16} />} />
          </div>
        </motion.div>

      </motion.div>
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