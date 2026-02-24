import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  RiArrowLeftLine, 
  RiCheckFill, 
  RiFireFill,
  RiVerifiedBadgeFill,
  RiArrowUpSLine,
  RiArrowDownSLine
} from "react-icons/ri";
import { MdOutlineFitnessCenter } from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../../lib/axios";

const ITEM_HEIGHT = 40;

const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const dateParam = searchParams.get("date");
  
  const scrollRef = useRef(null);

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // State for Duration Input
  const [quantity, setQuantity] = useState(30); 
  const [selectedUnit, setSelectedUnit] = useState({ label: "Minutes", value: "minutes", multiplier: 1 });

  const durationUnits = [
    { label: "Minutes", value: "minutes", multiplier: 1 },
    { label: "Hours", value: "hours", multiplier: 60 },
  ];

  // Get user's weight from Redux state to calculate accurate calorie burn (Default to 70kg)
  const userWeight = useSelector((state) => state.auth.user?.weight || 70);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const response = await api.get(`/api/exercises/${id}/`);
        setExercise(response.data);
      } catch (err) {
        console.error("Error fetching exercise details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, [id]);

  // --- UNIT SCROLL LOGIC ---
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const centerIndex = Math.round(scrollTop / ITEM_HEIGHT);
      if (centerIndex >= 0 && centerIndex < durationUnits.length) {
        const targetUnit = durationUnits[centerIndex];
        if (targetUnit.value !== selectedUnit.value) {
          setSelectedUnit(targetUnit);
          // Smart default adjustments when switching units
          if (targetUnit.value === 'hours' && quantity > 10) setQuantity(1);
          else if (targetUnit.value === 'minutes' && quantity < 10) setQuantity(30);
        }
      }
    }
  };

  const scrollByItem = (direction) => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollTop;
      const targetScroll = direction === 'up' ? currentScroll - ITEM_HEIGHT : currentScroll + ITEM_HEIGHT;
      scrollRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  const scrollToItem = (index) => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const handleAddExercise = async () => {
    if (isAdding) return;
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Smooth UI delay

    try {
      let dateToLog = dateParam || sessionStorage.getItem("selectedDate");
      
      if (dateToLog && dateToLog.includes('T')) {
          dateToLog = dateToLog.split('T')[0];
      }

      if (!dateToLog) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          dateToLog = `${year}-${month}-${day}`;
      }

      // Convert input to total minutes before saving
      const totalMinutes = quantity * selectedUnit.multiplier;

      const payload = {
        exercise: parseInt(id), // Updated key to match backend expectation
        duration_minutes: totalMinutes,
        date: dateToLog,
      };

      // Updated endpoint
      await api.post("/api/tracking/log-exercise/", payload);
      
      // Redirect to search page
      navigate(`/search?date=${dateToLog}`);

    } catch (error) {
      console.error("Error logging exercise:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full" 
        />
      </div>
    );
  }

  if (!exercise) return null;

  // Calculations
  const totalMinutes = quantity * selectedUnit.multiplier;
  const caloriesBurned = Math.round(exercise.met_value * userWeight * (totalMinutes / 60));
  const containerPaddingY = 44; 

  return (
    <div className="min-h-screen bg-white pb-32 font-sans text-gray-900">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
          >
            <RiArrowLeftLine className="text-xl" />
          </button>
          <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Log Exercise</span>
          <div className="w-10" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-5 pt-6 space-y-6"
      >
        
        {/* Title & Info Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
                <h1 className="text-xl font-black leading-tight text-gray-900 flex items-center gap-1.5">
                    {exercise.name}
                    {exercise.is_verified && (
                        <RiVerifiedBadgeFill className="text-blue-500 text-xl shrink-0" title="Verified Exercise" />
                    )}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-green-50 text-green-600 border-green-100 flex items-center gap-1">
                        <MdOutlineFitnessCenter /> MET: {exercise.met_value}
                    </span>
                    <span className="text-gray-300 text-xs">•</span>
                    <span className="text-sm text-gray-400 font-medium tracking-wide">
                        Cardio / Activity
                    </span>
                </div>
            </div>
          </div>
        </div>

        {/* --- MAIN INPUT SECTION (SCROLLABLE UNIT) --- */}
        <div className="bg-gray-50 rounded-3xl p-2 border border-gray-100 shadow-sm relative overflow-visible mt-6">
          <div className="flex items-stretch h-32">
            
            {/* Left: Scroll Unit Selector */}
            <div className="w-2/5 relative border-r border-gray-200 flex flex-col">
               <button 
                  onClick={() => scrollByItem('up')}
                  className="absolute top-0 left-0 right-0 h-8 z-20 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gradient-to-b from-gray-50 to-transparent rounded-tl-2xl cursor-pointer"
               >
                  <RiArrowUpSLine />
               </button>
               
               <div 
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
                  style={{ paddingTop: `${containerPaddingY}px`, paddingBottom: `${containerPaddingY}px` }}
               >
                 {durationUnits.map((unit, idx) => {
                   const isActive = selectedUnit.value === unit.value;
                   return (
                     <button
                       key={unit.value}
                       onClick={() => scrollToItem(idx)}
                       className={`
                           w-full h-10 flex items-center justify-center snap-center transition-all duration-200
                           ${isActive 
                               ? "text-gray-900 font-bold text-sm scale-100" 
                               : "text-gray-400 font-medium text-xs scale-90 opacity-60"
                           }
                       `}
                     >
                       {unit.label}
                     </button>
                   );
                 })}
               </div>

               <button 
                  onClick={() => scrollByItem('down')}
                  className="absolute bottom-0 left-0 right-0 h-8 z-20 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gradient-to-t from-gray-50 to-transparent rounded-bl-2xl cursor-pointer"
               >
                  <RiArrowDownSLine />
               </button>
               
               <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 border-y border-gray-200 pointer-events-none bg-white/40" />
            </div>

            {/* Right: Quantity Input */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-white rounded-r-2xl">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider absolute top-3">Duration</span>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-center text-5xl font-black text-gray-900 outline-none bg-transparent p-0"
              />
              <span className="text-xs text-gray-400 font-medium mt-1">
                 = {totalMinutes} mins total
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Calories Burned Box */}
        <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 flex flex-col items-center justify-center relative overflow-hidden mt-6">
            <span className="text-xs font-bold uppercase text-orange-400 tracking-wider mb-2 flex items-center gap-1 z-10">
                <RiFireFill className="text-lg" /> Estimated Burn
            </span>
            <div className="flex items-end gap-1 text-orange-600 z-10">
                <span className="text-5xl font-black">{caloriesBurned}</span>
                <span className="text-lg font-bold mb-1">kcal</span>
            </div>
            <p className="text-xs text-orange-400/80 mt-2 font-medium z-10">
                Based on MET value & your weight ({userWeight}kg)
            </p>

            {/* Background decoration */}
            <div className="absolute -left-6 -bottom-6 text-orange-100 opacity-50 pointer-events-none">
                <RiFireFill style={{ fontSize: '130px' }} />
            </div>
        </div>

      </motion.div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleAddExercise}
            disabled={isAdding || quantity <= 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${isAdding || quantity <= 0
                ? 'bg-gray-900 text-gray-500 cursor-not-allowed opacity-80' 
                : 'bg-black text-white shadow-xl shadow-gray-200 hover:bg-gray-900 active:scale-[0.98]'
              }
            `}
          >
            {isAdding ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                <span>Logging Exercise...</span>
              </>
            ) : (
              <>
                <RiCheckFill className="text-2xl" />
                <span>Log Exercise</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;