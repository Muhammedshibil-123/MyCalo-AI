import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  RiCameraAiFill, 
  RiSearchLine,
  RiFireFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCameraFill,
  RiImageFill,
  RiCloseLine
} from "react-icons/ri";
import { 
  IoMdAdd, 
  IoMdCreate, 
  IoMdTrash, 
  IoMdCheckmark, 
  IoMdClose, 
  IoIosArrowDown 
} from "react-icons/io";
import { 
  MdOutlineFastfood, 
  MdOutlineRestaurant, 
  MdOutlineDinnerDining,
  MdOutlineCookie,
  MdLocalFireDepartment
} from "react-icons/md";
import { format, addDays, subDays, isSameDay } from "date-fns";
import api from "../../lib/axios";

// --- Original MacroProgress Component ---
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

// --- COMPONENT: Macro Pill for Expanded Food Details ---
const MacroPill = ({ label, value, unit="g", theme }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-50 text-gray-700"
  };

  return (
    <div className={`${themes[theme] || themes.gray} rounded-xl p-2 flex flex-col items-center justify-center text-center`}>
      <span className="font-bold text-xs leading-none mb-1">{value}{unit}</span>
      <span className="text-[9px] opacity-70 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Interactive State for Log Items
  const [editingId, setEditingId] = useState(null); 
  const [editGrams, setEditGrams] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const GOAL_CALORIES = 2500;
  const GOAL_PROTEIN = 160;
  const GOAL_CARBS = 300;
  const GOAL_FAT = 80;

  // Sync Date to Session Storage
  useEffect(() => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    sessionStorage.setItem("selectedDate", dateStr);
  }, [currentDate]);

  // Fetch Logs Helper
  const fetchDailyLogs = async () => {
    try {
      if (!dailyData) setLoading(true); 
      const dateStr = currentDate.toISOString().split("T")[0];
      const response = await api.get(`/api/tracking/logs/?date=${dateStr}`);
      setDailyData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyLogs();
  }, [currentDate]);

  // --- ACTIONS ---

  const startEditing = (logId, currentGrams) => {
    setEditingId(logId);
    setEditGrams(currentGrams);
  };

  const toggleExpand = (logId) => {
    if (editingId) return; 
    setExpandedId(prev => prev === logId ? null : logId);
  };

  const handleUpdateLog = async (logId) => {
    try {
      await api.patch(`/api/tracking/logs/${logId}/`, {
        user_serving_grams: parseFloat(editGrams)
      });
      setEditingId(null);
      fetchDailyLogs(); 
    } catch (error) {
      console.error("Failed to update log", error);
      alert("Failed to update. Please try again.");
    }
  };

  const handleDeleteLog = async (logId) => {
    
    try {
      await api.delete(`/api/tracking/logs/${logId}/`);
      fetchDailyLogs(); 
    } catch (error) {
      console.error("Failed to delete log", error);
    }
  };

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

  const handleDateChange = (direction) => {
    setCurrentDate((prev) => direction === "prev" ? subDays(prev, 1) : addDays(prev, 1));
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAddFood = (mealId) => {
    sessionStorage.setItem("selectedMeal", mealId);
    navigate(`/search?meal=${mealId}`);
  };

  // Camera & File Handlers
  const handleMainButtonClick = () => setShowOptions(true);
  const handleGalleryClick = () => { setShowOptions(false); fileInputRef.current?.click(); };
  const handleCameraClick = async () => {
    setShowOptions(false); setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { console.error(err); setShowCamera(false); }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      c.toBlob(b => { if(b) { uploadFile(new File([b], "cam.jpg", {type:"image/jpeg"})); stopCamera(); }}, 'image/jpeg');
    }
  };
  const handleFileUpload = (e) => { if(e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value=null; };
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/nutrition/analyze-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/analyze-image-result", { state: { data: res.data } });
    } catch (e) { alert("Failed to analyze."); }
  };

  const getMealData = (type) => {
    if (!dailyData?.meals) return { items: [], total_meal_calories: 0 };
    return dailyData.meals.find(m => m.meal_type === type) || { items: [], total_meal_calories: 0 };
  };

  const mealSections = [
    { id: "breakfast", label: "Breakfast", icon: MdOutlineFastfood, time: "7:00 - 10:00 AM", gradient: "from-orange-50 to-orange-100/50", iconBg: "from-orange-100 to-orange-50" },
    { id: "lunch", label: "Lunch", icon: MdOutlineRestaurant, time: "12:00 - 2:00 PM", gradient: "from-blue-50 to-blue-100/50", iconBg: "from-blue-100 to-blue-50" },
    { id: "dinner", label: "Dinner", icon: MdOutlineDinnerDining, time: "6:00 - 9:00 PM", gradient: "from-purple-50 to-purple-100/50", iconBg: "from-purple-100 to-purple-50" },
    { id: "snack", label: "Snacks", icon: MdOutlineCookie, time: "Anytime", gradient: "from-green-50 to-green-100/50", iconBg: "from-green-100 to-green-50" },
  ];

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

      <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"/>
                <button onClick={stopCamera} className="absolute top-6 right-6 p-2 bg-black/50 rounded-full text-white"><RiCloseLine className="text-3xl" /></button>
            </div>
            <div className="h-32 bg-black flex items-center justify-center pb-8">
                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"><div className="w-16 h-16 bg-white rounded-full border-2 border-black" /></button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Options Modal */}
      {showOptions && !showCamera && (
        <div onClick={() => setShowOptions(false)} className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Choose Source</h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleCameraClick} className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-50">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg"><RiCameraFill /></div>
                    <span className="font-semibold text-gray-700">Camera</span>
                </button>
                <button onClick={handleGalleryClick} className="flex flex-col items-center justify-center gap-2 p-6 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-50">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg"><RiImageFill /></div>
                    <span className="font-semibold text-gray-700">Gallery</span>
                </button>
            </div>
            <button onClick={() => setShowOptions(false)} className="w-full py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-b-[2.5rem] shadow-sm px-6 pt-6 pb-8 z-10 relative mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hi, {user?.first_name || user?.name || user?.username || "User"} 👋</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Let's hit your goals today!</p>
          </div>
          <button onClick={handleMainButtonClick} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"><RiCameraAiFill className="text-xl" /></button>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 mb-6 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <RiSearchLine className="text-gray-400 text-xl shrink-0" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} placeholder="Search for food..." className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-700" />
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl mb-8">
          <button onClick={() => handleDateChange("prev")} className="p-2 text-gray-400 hover:text-gray-600 active:scale-90 transition-transform"><RiArrowLeftSLine className="text-xl" /></button>
          <span className="text-sm font-bold text-gray-800">{isSameDay(currentDate, new Date()) ? "Today" : format(currentDate, "MMMM d")}</span>
          <button onClick={() => handleDateChange("next")} className="p-2 text-gray-400 hover:text-gray-600 active:scale-90 transition-transform"><RiArrowRightSLine className="text-xl" /></button>
        </div>

        {/* --- ORIGINAL STATS SECTION --- */}
        <div className="flex items-center gap-6">
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

      {/* --- INTERACTIVE FOOD LIST --- */}
      <div className="px-4 space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)
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
                <div className={`px-4 py-3 bg-gradient-to-r ${meal.gradient} border-b border-gray-100`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meal.iconBg} flex items-center justify-center shadow-sm`}>
                        <MealIcon className="text-xl text-gray-700" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{meal.label}</div>
                        <div className="text-xs text-gray-600 font-medium">
                          {data.total_meal_calories > 0 ? `${data.total_meal_calories} kcal` : meal.time}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleAddFood(meal.id)} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 shadow-md active:scale-95 transition-all">
                      <IoMdAdd className="text-xl" />
                    </button>
                  </div>
                </div>

                {data.items.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {data.items.map((item) => {
                      const isExpanded = expandedId === item.id;
                      const isEditing = editingId === item.id;
                      
                      return (
                        <div key={item.id} className="transition-colors hover:bg-gray-50">
                          {/* Main Row */}
                          <div 
                            onClick={() => toggleExpand(item.id)}
                            className="px-4 py-3 flex items-start justify-between cursor-pointer"
                          >
                            <div className="flex-1 pr-2">
                              <div className="text-sm font-bold text-gray-900">{item.food_details.name}</div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                                <span className="text-blue-600">{item.food_details.protein}g P</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-purple-600">{item.food_details.carbohydrates}g C</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-orange-600">{item.food_details.fat}g F</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-baseline gap-1">
                                <span className="text-base font-black text-gray-900">{item.food_details.calories}</span>
                                <span className="text-[10px] font-bold text-gray-400">KCAL</span>
                              </div>

                              {isEditing ? (
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                  <input 
                                    type="number" 
                                    value={editGrams} 
                                    onChange={(e) => setEditGrams(e.target.value)}
                                    className="w-12 text-center text-xs font-bold border-none outline-none"
                                    autoFocus
                                  />
                                  <button onClick={() => handleUpdateLog(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><IoMdCheckmark /></button>
                                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><IoMdClose /></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
                                  <div className="text-[10px] font-bold text-gray-600 px-1.5">{item.user_serving_grams}g</div>
                                  <div className="w-px h-3 bg-gray-200"></div>
                                  <button onClick={() => startEditing(item.id, item.user_serving_grams)} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"><IoMdCreate /></button>
                                  <button onClick={() => handleDeleteLog(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><IoMdTrash /></button>
                                  <button 
                                    onClick={() => toggleExpand(item.id)} 
                                    className={`p-1 text-gray-400 hover:text-indigo-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  >
                                    <IoIosArrowDown />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded Details Section */}
                          {isExpanded && !isEditing && (
                            <div className="px-4 pb-4 pt-0 animate-fade-in">
                              <div className="pt-3 border-t border-gray-100 grid grid-cols-4 gap-2">
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