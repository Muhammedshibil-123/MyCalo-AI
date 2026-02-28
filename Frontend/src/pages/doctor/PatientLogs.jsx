import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  RiFireFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowLeftLine
} from "react-icons/ri";
import { 
  IoIosArrowDown 
} from "react-icons/io";
import { 
  MdOutlineFastfood, 
  MdOutlineRestaurant, 
  MdOutlineDinnerDining,
  MdOutlineCookie,
  MdLocalFireDepartment,
  MdOutlineFitnessCenter
} from "react-icons/md";
import { format, addDays, subDays, isSameDay } from "date-fns";
import api from "../../lib/axios";

// --- MacroProgress Component ---
const MacroProgress = ({ label, current, total, colorClass, delay }) => {
  const percent = Math.min(100, Math.round((current / Math.max(total, 1)) * 100));
  
  return (
    <div className="flex flex-col gap-1 w-full animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between text-xs font-semibold text-zinc-400">
        <span>{label}</span>
        <span className="text-zinc-300">{current}/{total}g</span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// --- Macro Pill Component ---
const MacroPill = ({ label, value, unit="g", theme }) => {
  const themes = {
    blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    green: "bg-green-500/10 text-green-400 border border-green-500/20",
    gray: "bg-zinc-800/50 text-zinc-300 border border-zinc-700/50"
  };

  return (
    <div className={`${themes[theme] || themes.gray} rounded-xl p-2 flex flex-col items-center justify-center text-center`}>
      <span className="font-bold text-xs leading-none mb-1 text-white">{value}<span className="text-[10px] text-inherit">{unit}</span></span>
      <span className="text-[9px] opacity-80 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

const PatientLogs = () => {
  const { patientId } = useParams(); // Gets the patient ID or roomId from the URL
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Extract just the user ID (e.g., '6' from 'user_6_doc_5')
  const actualUserId = patientId?.includes('_') ? patientId.split('_')[1] : patientId;

  // Fallback goals if patient profile isn't fully set up
  const GOAL_CALORIES = patientProfile?.daily_calorie_goal || 0;
  const GOAL_PROTEIN = patientProfile?.protein_goal || 0;
  const GOAL_CARBS = patientProfile?.carbs_goal || 0;
  const GOAL_FAT = patientProfile?.fats_goal || 0;

  // Fetch Patient Profile using the Doctor's specific patient endpoint
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!actualUserId) return;
      try {
        const response = await api.get(`/api/profiles/patient/${actualUserId}/`);
        setPatientProfile(response.data);
      } catch (error) {
        console.error("Could not fetch patient profile, using default goals.", error);
      }
    };
    fetchPatientProfile();
  }, [actualUserId]);

  // Fetch Both Food and Exercise Logs for the Patient
  const fetchDailyLogs = async () => {
    try {
      if (!dailyData && !exerciseData) setLoading(true); 
      const dateStr = format(currentDate, "yyyy-MM-dd");
      
      const [foodResponse, exerciseResponse] = await Promise.all([
        api.get(`/api/tracking/patient-logs/${actualUserId}/?date=${dateStr}`),
        api.get(`/api/tracking/patient-exercise-logs/${actualUserId}/?date=${dateStr}`)
      ]);
      
      setDailyData(foodResponse.data);
      setExerciseData(exerciseResponse.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (actualUserId) {
      fetchDailyLogs();
    }
  }, [currentDate, actualUserId]);

  const toggleExpand = (logId) => {
    setExpandedId(prev => prev === logId ? null : logId);
  };

  const stats = useMemo(() => {
    let totalConsumed = dailyData?.total_grant_calories || 0;
    let totalBurned = exerciseData?.total_burned_calories || 0;
    
    let netCalories = totalConsumed - totalBurned;
    
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
        burnt: Math.round(totalBurned),
        left: GOAL_CALORIES - Math.round(netCalories),
        percent: GOAL_CALORIES > 0 ? Math.max(0, Math.min(100, (netCalories / GOAL_CALORIES) * 100)) : 0
      },
      macros: {
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat)
      }
    };
  }, [dailyData, exerciseData, GOAL_CALORIES]);

  const handleDateChange = (direction) => {
    setCurrentDate((prev) => direction === "prev" ? subDays(prev, 1) : addDays(prev, 1));
  };

  const getMealData = (type) => {
    if (!dailyData?.meals) return { items: [], total_meal_calories: 0 };
    return dailyData.meals.find(m => m.meal_type === type) || { items: [], total_meal_calories: 0 };
  };

  const mealSections = [
    { id: "breakfast", label: "Breakfast", icon: MdOutlineFastfood, gradient: "bg-zinc-900/40", iconBg: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
    { id: "lunch", label: "Lunch", icon: MdOutlineRestaurant, gradient: "bg-zinc-900/40", iconBg: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
    { id: "dinner", label: "Dinner", icon: MdOutlineDinnerDining, gradient: "bg-zinc-900/40", iconBg: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
    { id: "snack", label: "Snacks", icon: MdOutlineCookie, gradient: "bg-zinc-900/40", iconBg: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.calories.percent / 100) * circumference;

  return (
    <div className="min-h-screen bg-black pb-28 font-sans">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}</style>

      {/* Top Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 rounded-b-[2.5rem] shadow-xl px-6 pt-6 pb-8 z-10 relative mb-6">
        
        {/* Navigation / Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <RiArrowLeftLine className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Patient Logs</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Viewing data for <span className="text-zinc-300">{patientProfile?.name || `Patient #${actualUserId}`}</span>
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-black border border-zinc-800 p-1 rounded-xl mb-8">
          <button onClick={() => handleDateChange("prev")} className="p-2 text-zinc-500 hover:text-white active:scale-90 transition-transform"><RiArrowLeftSLine className="text-xl" /></button>
          <span className="text-sm font-bold text-zinc-200">{isSameDay(currentDate, new Date()) ? "Today" : format(currentDate, "MMMM d, yyyy")}</span>
          <button onClick={() => handleDateChange("next")} className="p-2 text-zinc-500 hover:text-white active:scale-90 transition-transform"><RiArrowRightSLine className="text-xl" /></button>
        </div>

        {/* --- STATS SECTION --- */}
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r={radius} stroke="#27272a" strokeWidth="8" fill="none" />
              <circle
                cx="64" cy="64" r={radius}
                stroke={stats.calories.left < 0 ? "#ef4444" : "url(#gradient)"} 
                strokeWidth="8" fill="none"
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
              <span className={`text-2xl font-bold ${stats.calories.left < 0 ? 'text-red-500' : 'text-white'}`}>
                {stats.calories.left}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Left</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
               <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5">
                 <div className="flex items-center gap-1 mb-1">
                   <RiFireFill className="text-green-500 text-xs" />
                   <span className="text-[10px] font-bold text-green-400 uppercase">Eaten</span>
                 </div>
                 <span className="text-lg font-bold text-white">{stats.calories.eaten}</span>
               </div>
               
               <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5">
                 <div className="flex items-center gap-1 mb-1">
                   <MdLocalFireDepartment className="text-orange-500 text-xs" />
                   <span className="text-[10px] font-bold text-orange-400 uppercase">Burnt</span>
                 </div>
                 <span className="text-lg font-bold text-white">{stats.calories.burnt}</span>
               </div>
            </div>

            <div className="space-y-2.5">
              <MacroProgress label="Protein" current={stats.macros.protein} total={GOAL_PROTEIN} colorClass="bg-blue-500" delay={100} />
              <MacroProgress label="Carbs" current={stats.macros.carbs} total={GOAL_CARBS} colorClass="bg-purple-500" delay={200} />
              <MacroProgress label="Fat" current={stats.macros.fat} total={GOAL_FAT} colorClass="bg-amber-500" delay={300} />
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTS --- */}
      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-zinc-800/50 border border-zinc-800 rounded-2xl animate-pulse" />)
        ) : (
          <>
            {/* Meal Sections */}
            {mealSections.map((meal, index) => {
              const data = getMealData(meal.id);
              const MealIcon = meal.icon;
              
              return (
                <div 
                  key={meal.id} 
                  className="bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-zinc-800 transition-all duration-300 hover:border-zinc-700 animate-fade-in-up"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <div className={`px-4 py-3 ${meal.gradient} border-b border-zinc-800/50`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${meal.iconBg} flex items-center justify-center shadow-sm`}>
                          <MealIcon className="text-xl" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{meal.label}</div>
                          <div className="text-xs text-zinc-400 font-medium">
                            {data.total_meal_calories > 0 ? `${data.total_meal_calories} kcal` : 'No items logged'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {data.items.length > 0 && (
                    <div className="divide-y divide-zinc-800/50">
                      {data.items.map((item) => {
                        const isExpanded = expandedId === item.id;
                        
                        return (
                          <div key={item.id} className="transition-colors hover:bg-zinc-800/30">
                            {/* Main Row */}
                            <div 
                              onClick={() => toggleExpand(item.id)}
                              className="px-4 py-3 flex items-start justify-between cursor-pointer"
                            >
                              <div className="flex-1 pr-2">
                                <div className="text-sm font-bold text-white">{item.food_details.name}</div>
                                <div className="text-xs mt-1 flex items-center gap-1.5 font-medium">
                                  <span className="text-blue-400">{item.food_details.protein}g P</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-purple-400">{item.food_details.carbohydrates}g C</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-orange-400">{item.food_details.fat}g F</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-base font-black text-white">{item.food_details.calories}</span>
                                  <span className="text-[10px] font-bold text-zinc-500">KCAL</span>
                                </div>

                                <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded-lg p-1">
                                  <div className="text-[10px] font-bold text-zinc-300 px-1.5">{item.user_serving_grams}g</div>
                                  <div className="w-px h-3 bg-zinc-800"></div>
                                  <button 
                                    className={`p-1 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  >
                                    <IoIosArrowDown />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details Section */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-0 animate-fade-in">
                                <div className="pt-3 border-t border-zinc-800/50 grid grid-cols-4 gap-2">
                                  <MacroPill label="Fiber" value={item.food_details.fiber || 0} theme="green" />
                                  <MacroPill label="Sugar" value={item.food_details.sugar || 0} theme="orange" />
                                  <MacroPill label="Sodium" value={item.food_details.sodium || 0} unit="mg" theme="blue" />
                                  <MacroPill label="Sat. Fat" value={item.food_details.saturated_fat || 0} theme="purple" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Exercise Section */}
            <div 
              className="bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-zinc-800 transition-all duration-300 hover:border-zinc-700 animate-fade-in-up"
              style={{ animationDelay: `700ms` }}
            >
              <div className={`px-4 py-3 bg-zinc-900/40 border-b border-zinc-800/50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shadow-sm`}>
                      <MdOutlineFitnessCenter className="text-xl" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Exercise</div>
                      <div className="text-xs text-zinc-400 font-medium">
                        {exerciseData?.total_burned_calories > 0 
                          ? `${exerciseData.total_burned_calories} kcal burnt` 
                          : "No exercises logged"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {exerciseData?.exercises?.length > 0 && (
                <div className="divide-y divide-zinc-800/50">
                  {exerciseData.exercises.map((ex) => (
                    <div key={ex.log_id} className="px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                      <div className="flex-1 pr-2">
                        <div className="text-sm font-bold text-white">{ex.name}</div>
                        <div className="text-xs mt-1 font-medium flex items-center gap-1.5">
                          <span className="text-teal-400">MET: {ex.met_value}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-orange-500">{ex.burned_calories}</span>
                          <span className="text-[10px] font-bold text-zinc-500">KCAL</span>
                        </div>

                        <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded-lg p-1">
                          <div className="text-[10px] font-bold text-teal-400 px-1.5">{ex.duration_minutes}m</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientLogs;