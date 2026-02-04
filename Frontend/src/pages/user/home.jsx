import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// --- Icons (Combined Set) ---
import { 
  RiCameraAiFill, 
  RiSearchLine,
  RiFireFill,
  RiArrowLeftSLine,
  RiArrowRightSLine
} from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";
import { 
  MdOutlineFastfood, 
  MdOutlineRestaurant, 
  MdOutlineDinnerDining,
  MdOutlineCookie,
  MdLocalFireDepartment
} from "react-icons/md";

import { format, addDays, subDays, isSameDay } from "date-fns";
import api from "../../lib/axios";

// --- Helper Component: Macro Progress Bar (For the Top Stats) ---
const MacroProgress = ({ label, current, total, colorClass, delay }) => {
  const percent = Math.min(100, Math.round((current / total) * 100));
  
  return (
    <div className="flex flex-col gap-1 w-full animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between text-xs font-semibold text-gray-500">
        <span>{label}</span>
        <span>{current}/{total}g</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Goals
  const GOAL_CALORIES = 2500;
  const GOAL_PROTEIN = 160;
  const GOAL_CARBS = 300;
  const GOAL_FAT = 80;

  // --- Data Fetching ---
  useEffect(() => {
    const fetchDailyLogs = async () => {
      try {
        setLoading(true);
        const dateStr = currentDate.toISOString().split("T")[0];
        const response = await api.get(`/api/tracking/logs/?date=${dateStr}`);
        setDailyData(response.data);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyLogs();
  }, [currentDate]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    let totalConsumed = dailyData?.total_grant_calories || 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    if (dailyData?.meals) {
      dailyData.meals.forEach(meal => {
        meal.items.forEach(item => {
          totalProtein += item.food_details.protein || 0;
          totalCarbs += item.food_details.carbohydrates || 0;
          totalFat += item.food_details.fat || 0;
        });
      });
    }

    return {
      calories: {
        goal: GOAL_CALORIES,
        eaten: Math.round(totalConsumed),
        left: Math.max(0, GOAL_CALORIES - Math.round(totalConsumed)),
        percent: Math.min(100, (totalConsumed / GOAL_CALORIES) * 100)
      },
      macros: {
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat)
      }
    };
  }, [dailyData]);

  // --- Handlers ---
  const handleDateChange = (direction) => {
    setCurrentDate((prev) => direction === "prev" ? subDays(prev, 1) : addDays(prev, 1));
  };

  const getMealData = (type) => {
    if (!dailyData?.meals) return { items: [], total_meal_calories: 0 };
    return dailyData.meals.find(m => m.meal_type === type) || { items: [], total_meal_calories: 0 };
  };

  // --- Configuration (Your Preferred Colors & Icons) ---
  const mealSections = [
    { 
      id: "breakfast", 
      label: "Breakfast", 
      icon: MdOutlineFastfood,
      time: "7:00 - 10:00 AM",
      gradient: "from-orange-50 to-orange-100/50",
      iconBg: "from-orange-100 to-orange-50"
    },
    { 
      id: "lunch", 
      label: "Lunch", 
      icon: MdOutlineRestaurant,
      time: "12:00 - 2:00 PM",
      gradient: "from-blue-50 to-blue-100/50",
      iconBg: "from-blue-100 to-blue-50"
    },
    { 
      id: "dinner", 
      label: "Dinner", 
      icon: MdOutlineDinnerDining,
      time: "6:00 - 9:00 PM",
      gradient: "from-purple-50 to-purple-100/50",
      iconBg: "from-purple-100 to-purple-50"
    },
    { 
      id: "snack", 
      label: "Snacks", 
      icon: MdOutlineCookie,
      time: "Anytime",
      gradient: "from-green-50 to-green-100/50",
      iconBg: "from-green-100 to-green-50"
    },
  ];

  // Circle Progress Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.calories.percent / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-sans">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}</style>

      {/* --- TOP SECTION (My Design) --- */}
      <div className="bg-white rounded-b-[2.5rem] shadow-sm px-6 pt-6 pb-8 z-10 relative mb-6">
        
        {/* Header & QR */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Hi, {user?.first_name || "User"} 👋
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Let's hit your goals today!</p>
          </div>
          <button 
            onClick={() => navigate("/qr")}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
          >
            <RiCameraAiFill className="text-xl" />
          </button>
        </div>

        {/* Search Bar */}
        <div 
          onClick={() => navigate("/search")}
          className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 mb-6 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <RiSearchLine className="text-gray-400 text-xl" />
          <span className="text-gray-400 text-sm font-medium">Search for food, recipes...</span>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl mb-6">
          <button onClick={() => handleDateChange("prev")} className="p-2 text-gray-400 hover:text-gray-600 active:scale-90 transition-transform">
            <RiArrowLeftSLine className="text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">
              {isSameDay(currentDate, new Date()) ? "Today" : format(currentDate, "MMMM d")}
            </span>
          </div>
          <button onClick={() => handleDateChange("next")} className="p-2 text-gray-400 hover:text-gray-600 active:scale-90 transition-transform">
            <RiArrowRightSLine className="text-xl" />
          </button>
        </div>

        {/* Main Stats (Circular + Macros) */}
        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r={radius} stroke="#f3f4f6" strokeWidth="8" fill="none" />
              <circle
                cx="64" cy="64" r={radius}
                stroke="url(#gradient)" strokeWidth="8" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">{stats.calories.left}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Left</span>
            </div>
          </div>

          {/* Macros & Small Cards */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
               <div className="bg-green-50 rounded-xl p-2.5">
                 <div className="flex items-center gap-1 mb-1">
                   <RiFireFill className="text-green-500 text-xs" />
                   <span className="text-[10px] font-bold text-green-700 uppercase">Eaten</span>
                 </div>
                 <span className="text-lg font-bold text-gray-800">{stats.calories.eaten}</span>
               </div>
               <div className="bg-orange-50 rounded-xl p-2.5">
                 <div className="flex items-center gap-1 mb-1">
                   <MdLocalFireDepartment className="text-orange-500 text-xs" />
                   <span className="text-[10px] font-bold text-orange-700 uppercase">Burnt</span>
                 </div>
                 <span className="text-lg font-bold text-gray-800">0</span>
               </div>
            </div>

            <div className="space-y-2.5">
              <MacroProgress label="Protein" current={stats.macros.protein} total={GOAL_PROTEIN} colorClass="bg-blue-500" delay={100} />
              <MacroProgress label="Carbs" current={stats.macros.carbs} total={GOAL_CARBS} colorClass="bg-purple-500" delay={200} />
              <MacroProgress label="Fat" current={stats.macros.fat} total={GOAL_FAT} colorClass="bg-yellow-500" delay={300} />
            </div>
          </div>
        </div>
      </div>

      {/* --- MEAL SECTION (Your Design) --- */}
      <div className="px-4 space-y-4">
        {loading ? (
          // Loading Skeletons
          [1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : (
          mealSections.map((meal, index) => {
            const data = getMealData(meal.id);
            const MealIcon = meal.icon;
            
            return (
              <div 
                key={meal.id} 
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                {/* Header (Your Gradient Style) */}
                <div className={`px-4 py-3 bg-gradient-to-r ${meal.gradient} border-b border-gray-100`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meal.iconBg} flex items-center justify-center shadow-sm`}>
                        <MealIcon className="text-xl text-gray-700" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{meal.label}</div>
                        <div className="text-xs text-gray-600 font-medium">
                          {data.total_meal_calories > 0 
                            ? `${data.total_meal_calories} kcal` 
                            : meal.time}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/search?meal=${meal.id}&date=${currentDate.toISOString().split('T')[0]}`)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 shadow-md active:scale-95 transition-all"
                    >
                      <IoMdAdd className="text-xl" />
                    </button>
                  </div>
                </div>

                {/* Items List (Your List Style) */}
                {data.items.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {data.items.map((item, itemIndex) => (
                      <div 
                        key={item.id} 
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 pr-4">
                          <div className="text-sm font-bold text-gray-900">{item.food_details.name}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span>{item.user_serving_grams}g</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{item.food_details.protein}g Protein</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            {item.food_details.calories}
                          </div>
                          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">kcal</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-gray-400 font-medium">No food logged yet</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;