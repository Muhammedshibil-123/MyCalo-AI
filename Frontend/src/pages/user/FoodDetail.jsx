import { useState, useEffect, useRef, memo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  RiArrowLeftLine, 
  RiCheckFill, 
  RiFireFill,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,   
  RiArrowRightSLine,
  RiArrowUpSFill,
  RiArrowDownSFill,
  RiVerifiedBadgeFill // Added for verified tick
} from "react-icons/ri";
import { 
  MdOutlineEggAlt,     
  MdOutlineBakeryDining, 
  MdOutlineOilBarrel,    
  MdOutlineWaterDrop,
  MdOutlineScience,
  MdOutlineImageNotSupported
} from "react-icons/md";
import { TbSalt } from "react-icons/tb";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import api from "../../lib/axios";

const ITEM_HEIGHT = 40; 

// --- ISOLATED VOTE COMPONENT ---
// This component manages its own state, so the parent (FoodDetail) doesn't re-render on vote.
const VoteWidget = memo(({ foodId, initialVotes }) => {
  const [voteCount, setVoteCount] = useState(initialVotes);
  const [userVote, setUserVote] = useState(0); // 0: None, 1: Up, -1: Down
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type) => {
    if (isVoting) return;
    setIsVoting(true);

    // Optimistic Update (makes it feel instant)
    const voteValue = type === 'upvote' ? 1 : -1;
    const previousUserVote = userVote;
    const previousCount = voteCount;

    let newVoteStatus = 0;
    let newCount = voteCount;

    if (userVote === voteValue) {
      // Toggle off
      newVoteStatus = 0;
      newCount -= voteValue;
    } else {
      // New vote or switch vote
      newVoteStatus = voteValue;
      newCount += (voteValue - userVote);
    }

    setUserVote(newVoteStatus);
    setVoteCount(newCount);

    try {
        const res = await api.post(`/api/foods/${foodId}/vote/`, { vote_type: type });
        // Sync with actual server data to be safe
        setVoteCount(res.data.total_votes);
        if (res.data.user_vote !== undefined) {
             setUserVote(res.data.user_vote || 0); 
        }
    } catch (error) {
        console.error("Voting failed", error);
        // Revert on error
        setUserVote(previousUserVote);
        setVoteCount(previousCount);
    } finally {
        setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-full py-2 px-1 min-w-[3rem] shadow-sm">
        <button 
            onClick={() => handleVote('upvote')}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                userVote === 1 
                ? 'bg-orange-100 text-orange-500 shadow-inner' 
                : 'text-gray-400 hover:bg-gray-200'
            }`}
        >
            <RiArrowUpSFill className="text-2xl" />
        </button>
        
        <span className={`text-sm font-bold my-1 ${
            userVote !== 0 ? 'text-gray-800' : 'text-gray-500'
        }`}>
            {voteCount}
        </span>
        
        <button 
            onClick={() => handleVote('downvote')}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                userVote === -1 
                ? 'bg-blue-100 text-blue-500 shadow-inner' 
                : 'text-gray-400 hover:bg-gray-200'
            }`}
        >
            <RiArrowDownSFill className="text-2xl" />
        </button>
    </div>
  );
});

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Refs for scrolling
  const scrollRef = useRef(null);      
  const imageScrollRef = useRef(null); 
  
  const meal = searchParams.get("meal");
  const dateParam = searchParams.get("date");
  
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [quantity, setQuantity] = useState(100); 
  const [selectedUnit, setSelectedUnit] = useState({ label: "Grams", value: "grams", grams: 1 });

  const servingUnits = [
    { label: "Grams", value: "grams", grams: 1 },
    { label: "Small Bowl", value: "small-bowl", grams: 150 },
    { label: "Medium Bowl", value: "medium-bowl", grams: 250 },
    { label: "Large Bowl", value: "large-bowl", grams: 350 },
    { label: "Cup (200ml)", value: "cup", grams: 200 },
    { label: "Small Plate", value: "small-plate", grams: 180 },
    { label: "Large Plate", value: "large-plate", grams: 300 },
    { label: "Serving", value: "serving", grams: 100 },
  ];

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const response = await api.get(`/api/foods/${id}/`);
        setFood(response.data);
      } catch (err) {
        console.error("Error fetching food details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
  }, [id]);

  // --- SERVING UNIT SCROLL LOGIC ---
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const centerIndex = Math.round(scrollTop / ITEM_HEIGHT);
      if (centerIndex >= 0 && centerIndex < servingUnits.length) {
        const targetUnit = servingUnits[centerIndex];
        if (targetUnit.value !== selectedUnit.value) {
          setSelectedUnit(targetUnit);
          if (targetUnit.value === 'grams' && quantity < 10) setQuantity(100);
          else if (selectedUnit.value === 'grams' && targetUnit.value !== 'grams' && quantity > 10) setQuantity(1);
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

  // --- IMAGE SLIDER LOGIC ---
  const scrollImages = (direction) => {
    if (imageScrollRef.current) {
      const { clientWidth } = imageScrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      imageScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddFood = async () => {
    if (isAdding) return;
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const dateToLog = dateParam || new Date().toISOString().split('T')[0];
      const mealType = meal ? meal.toUpperCase() : "SNACK";
      const totalGrams = quantity * selectedUnit.grams;

      const payload = {
        food_item: id,
        user_serving_grams: totalGrams,
        meal_type: mealType,
        date: dateToLog,
      };

      await api.post("/api/tracking/logs/", payload);
      navigate(`/search?meal=${meal || 'snack'}&date=${dateToLog}`);

    } catch (error) {
      console.error("Error adding food:", error);
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

  if (!food) return null;

  const totalGrams = quantity * selectedUnit.grams;
  const multiplier = totalGrams / 100;
  
  const nutrients = {
    calories: Math.round(food.calories * multiplier),
    protein: (food.protein * multiplier).toFixed(1),
    carbs: (food.carbohydrates * multiplier).toFixed(1),
    fat: (food.fat * multiplier).toFixed(1),
    fiber: (food.fiber * multiplier).toFixed(1),
    sugar: (food.sugar * multiplier).toFixed(1),
    sodium: Math.round(food.sodium * multiplier),
    cholesterol: Math.round(food.cholesterol * multiplier),
  };

  const macros = [
    { label: "Protein", val: nutrients.protein, unit: "g", icon: MdOutlineEggAlt, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Carbs", val: nutrients.carbs, unit: "g", icon: MdOutlineBakeryDining, color: "text-green-600", bg: "bg-green-50" },
    { label: "Fat", val: nutrients.fat, unit: "g", icon: MdOutlineOilBarrel, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const containerPaddingY = 44; 
  const hasImages = food.images && food.images.length > 0;

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
          <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Add Item</span>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
        
        {/* Title, Votes & Info Section */}
        <div className="space-y-4">
          
          <div className="flex items-start justify-between">
            {/* Left: Title and Description */}
            <div className="flex-1 pr-4">
                <h1 className="text-xl font-black leading-tight text-gray-900 flex items-center gap-1.5">
                    {food.name}
                    {food.is_verified && (
                        <RiVerifiedBadgeFill className="text-blue-500 text-xl shrink-0" />
                    )}
                </h1>
                
                {/* Description Line */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        food.source === 'AI' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        food.source === 'ADMIN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                        {food.source}
                    </span>
                    
                    <span className="text-gray-300 text-xs">•</span>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                        <span>{food.brand || 'Generic'}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{food.serving_size}</span>
                    </div>
                </div>
            </div>

            {/* Right: Isolated Vote Widget */}
            <VoteWidget foodId={id} initialVotes={food.votes || 0} />
          </div>
          
          {/* --- IMAGE SLIDER --- */}
          <div className="relative group w-full aspect-video bg-gray-50 rounded-2xl border border-gray-100 shadow-sm mt-4">
             {hasImages ? (
                <>
                    <div 
                        ref={imageScrollRef}
                        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
                    >
                        {food.images.map((imgObj) => (
                            <div key={imgObj.id} className="min-w-full h-full snap-center flex-shrink-0">
                                <img 
                                   src={imgObj.image} 
                                   alt={food.name} 
                                   className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    {food.images.length > 1 && (
                        <>
                            <button 
                                onClick={() => scrollImages('left')}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-95 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                            >
                                <RiArrowLeftSLine className="text-xl" />
                            </button>
                            <button 
                                onClick={() => scrollImages('right')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-95 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                            >
                                <RiArrowRightSLine className="text-xl" />
                            </button>
                            
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                                {food.images.map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
                                ))}
                            </div>
                        </>
                    )}
                </>
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <MdOutlineImageNotSupported className="text-4xl" />
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-2">No Image</span>
                </div>
             )}
          </div>
        </div>

        {/* --- MAIN INPUT SECTION --- */}
        <div className="bg-gray-50 rounded-3xl p-2 border border-gray-100 shadow-sm relative overflow-visible">
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
                 {servingUnits.map((unit, idx) => {
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
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider absolute top-3">Quantity</span>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-center text-5xl font-black text-gray-900 outline-none bg-transparent p-0"
              />
              <span className="text-xs text-gray-400 font-medium mt-1">
                 = {Math.round(totalGrams)}g total
              </span>
            </div>
          </div>
        </div>

        {/* Calories & Macros */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-gray-900">Nutrition</h3>
            <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              <RiFireFill />
              <span className="font-black text-lg">{nutrients.calories}</span>
              <span className="text-xs font-bold uppercase">kcal</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {macros.map((m) => (
              <div key={m.label} className={`flex flex-col items-center p-4 rounded-2xl ${m.bg}`}>
                <m.icon className={`text-2xl ${m.color} mb-2`} />
                <span className={`text-xl font-bold ${m.color}`}>{m.val}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Micronutrients */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
            <MdOutlineScience className="text-lg" /> Micronutrients
          </h4>
          <div className="space-y-3">
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Fiber
                </span>
                <span className="font-bold text-gray-900">{nutrients.fiber}g</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Sugar
                </span>
                <span className="font-bold text-gray-900">{nutrients.sugar}g</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                   <MdOutlineWaterDrop className="text-blue-400" /> Sodium
                </span>
                <span className="font-bold text-gray-900">{nutrients.sodium}mg</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                   <TbSalt className="text-gray-400" /> Cholesterol
                </span>
                <span className="font-bold text-gray-900">{nutrients.cholesterol}mg</span>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleAddFood}
            disabled={isAdding || quantity <= 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${isAdding || quantity <= 0
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
                <span>Add Food</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;