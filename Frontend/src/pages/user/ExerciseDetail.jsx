import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  RiArrowLeftLine, 
  RiCheckFill, 
  RiFireFill,
  RiVerifiedBadgeFill
} from "react-icons/ri";
import { MdOutlineFitnessCenter, MdTimer } from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../../lib/axios";

const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const dateParam = searchParams.get("date");
  
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Default to 30 minutes of exercise
  const [duration, setDuration] = useState(30); 

  // Get user's weight from Redux state to calculate accurate calorie burn (Default to 70kg if not available)
  const userWeight = useSelector((state) => state.auth.user?.weight || 70);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        // NOTE: Ensure you have a public detail endpoint for exercises in Django (e.g., /api/exercises/<id>/)
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

      const payload = {
        exercise_item: id,
        duration_minutes: duration,
        date: dateToLog,
      };

      // Ensure your backend tracking log API accepts exercise tracking payloads
      await api.post("/api/tracking/logs/", payload);
      navigate(`/?date=${dateToLog}`);

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

  // Calculate estimated calories burned based on standard MET formula:
  // Calories Burned = METs x Weight (kg) x Time (hours)
  const caloriesBurned = Math.round(exercise.met_value * userWeight * (duration / 60));

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

      <div className="max-w-md mx-auto px-5 pt-6 space-y-8">
        
        {/* Title & Info Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black leading-tight text-gray-900 flex items-center gap-2">
            {exercise.name}
            {exercise.is_verified && (
                <RiVerifiedBadgeFill className="text-blue-500 text-2xl shrink-0" />
            )}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-green-50 text-green-600 border-green-100 flex items-center gap-1">
                  <MdOutlineFitnessCenter /> MET: {exercise.met_value}
              </span>
          </div>
        </div>

        {/* Duration Input Section */}
        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm relative flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1">
                <MdTimer className="text-lg" /> Duration (Minutes)
            </span>
            <div className="flex items-end gap-2">
                <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-32 text-center text-6xl font-black text-blue-600 outline-none bg-transparent p-0 border-b-2 border-blue-200 focus:border-blue-500 transition-colors"
                />
                <span className="text-xl font-bold text-gray-400 mb-2">mins</span>
            </div>
        </div>

        {/* Estimated Calories Burned */}
        <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase text-orange-400 tracking-wider mb-2 flex items-center gap-1">
                <RiFireFill className="text-lg" /> Estimated Burn
            </span>
            <div className="flex items-end gap-1 text-orange-600">
                <span className="text-5xl font-black">{caloriesBurned}</span>
                <span className="text-lg font-bold mb-1">kcal</span>
            </div>
            <p className="text-xs text-orange-400 mt-2 font-medium">Based on MET & your weight</p>
        </div>

      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleAddExercise}
            disabled={isAdding || duration <= 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${isAdding || duration <= 0
                ? 'bg-gray-900 text-gray-500 cursor-not-allowed opacity-80' 
                : 'bg-black text-white shadow-xl shadow-gray-200 active:scale-[0.98]'
              }
            `}
          >
            {isAdding ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                <span>Logging...</span>
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