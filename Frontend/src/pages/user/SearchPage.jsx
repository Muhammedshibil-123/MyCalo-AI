import { useState, useEffect, useRef, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  IoMdArrowBack, 
  IoMdSearch, 
  IoMdAdd, 
  IoMdClose, 
  IoMdCheckmark,
  IoMdRestaurant,
  IoMdFlame,
  IoMdFitness
} from "react-icons/io";
import { RiRobot2Line, RiEdit2Line, RiShoppingBasketLine } from "react-icons/ri";
import api from "../../lib/axios";

// --- 1. Isolated Search Input Component (Fixes Rerender Issue) ---
const SearchHeader = memo(({ onSearch, onBack, initialQuery, onOpenCreateMenu }) => {
  const [localValue, setLocalValue] = useState(initialQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(localValue);
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [localValue, onSearch]);

  return (
    <div className="flex items-center gap-3 mb-2">
      <button 
        onClick={onBack} 
        className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
      >
        <IoMdArrowBack className="text-2xl" />
      </button>
      
      <div className="flex-1 relative group">
        <input
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="Search for food..."
          className="w-full bg-gray-100/80 rounded-2xl h-12 px-4 pl-11 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-gray-400"
        />
        <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      </div>

      {/* Top Right: Create New (AI/Manual) */}
      <button 
        onClick={onOpenCreateMenu}
        className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        <IoMdAdd className="text-2xl" />
      </button>
    </div>
  );
});

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // --- Core State ---
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState("foods");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Meal Context State ---
  const [selectedMeal, setSelectedMeal] = useState(searchParams.get("meal") || null);
  const [showMealPopover, setShowMealPopover] = useState(false);

  // --- Batch Selection State ---
  const [selectedItems, setSelectedItems] = useState([]); // Array of full item objects

  // --- UI State ---
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // --- Search Logic ---
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await api.get("/api/search/", {
          params: { q: query, type: searchType },
        });
        setResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, searchType]);

  // Sync meal change to URL (optional, keeps refresh consistancy)
  useEffect(() => {
    if (selectedMeal) {
      searchParams.set("meal", selectedMeal);
    } else {
      searchParams.delete("meal");
    }
    setSearchParams(searchParams, { replace: true });
  }, [selectedMeal, searchParams, setSearchParams]);


  // --- Handlers ---

  const toggleItemSelection = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleMealSelect = (meal) => {
    setSelectedMeal(meal);
    setShowMealPopover(false);
  };

  const clearMeal = () => {
    setSelectedMeal(null);
  };

  const handleBatchAdd = () => {
    if (!selectedMeal) {
      // If user tries to add without a meal selected, shake the toggle or show alert
      // For now, force open the popover or show a toast
      setShowMealPopover(true);
      return;
    }
    
    // API Call to add all items
    console.log(`Adding ${selectedItems.length} items to ${selectedMeal}`);
    // await api.post('/track/batch', { meal: selectedMeal, items: selectedItems })
    // navigate('/dashboard');
  };

  // Calculate totals for the floating bar
  const totalCalories = selectedItems.reduce((sum, item) => sum + (item.calories || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans selection:bg-blue-100">
      
      {/* --- Sticky Header --- */}
      <div className="bg-white/80 backdrop-blur-md px-4 pt-6 pb-2 sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-xl mx-auto">
          
          <SearchHeader 
            initialQuery={query} 
            onSearch={setQuery} 
            onBack={() => navigate(-1)}
            onOpenCreateMenu={() => setShowCreateMenu(true)}
          />

          {/* Controls Row: Toggles + Meal Context Trigger */}
          <div className="flex items-center justify-between gap-3 mt-3">
            
            {/* Type Toggles */}
            <div className="flex p-1 bg-gray-100 rounded-xl flex-1">
              <button
                onClick={() => setSearchType("foods")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  searchType === "foods" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Foods
              </button>
              <button
                onClick={() => setSearchType("exercises")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  searchType === "exercises" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Exercises
              </button>
            </div>

            {/* Meal Selector Trigger (Right aligned to toggle) */}
            <div className="relative">
              {!selectedMeal ? (
                <button
                  onClick={() => setShowMealPopover(!showMealPopover)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <IoMdRestaurant /> Select Meal
                  <IoMdAdd />
                </button>
              ) : (
                // Replaces trigger when selected, but positioned separately below in user request? 
                // User said: "below left of the foods and exerse toggle". 
                // Let's put the trigger here, and the TAG below as requested.
                // Keeping a "Change" button here could be useful, but let's hide it to follow "remove then plus button comes back" logic.
                <button
                  onClick={() => setShowMealPopover(!showMealPopover)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200"
                >
                  <IoMdAdd className="rotate-45" /> {/* Use as a clear or edit visual? Or just hidden? */}
                  {/* Actually user said "if remove then plus button click time the pop will come" 
                      So if selected, we show NOTHING here, but show the TAG below. */}
                </button>
              )}

              {/* Mini Popover (Meal Selector) */}
              {showMealPopover && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => (
                    <button
                      key={meal}
                      onClick={() => handleMealSelect(meal.toLowerCase())}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Meal Tag (Below Toggle) */}
          {selectedMeal && (
            <div className="flex items-center gap-2 mt-3 animate-in slide-in-from-top-2 duration-300">
              <span className="text-xs font-semibold text-gray-400">Context:</span>
              <div className="flex items-center gap-1 pl-2 pr-1 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium shadow-sm">
                <span className="capitalize">{selectedMeal}</span>
                <button 
                  onClick={clearMeal}
                  className="p-0.5 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <IoMdClose />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Results List --- */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => toggleItemSelection(item)} // Row click also toggles
                  className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? "bg-blue-50/50 border-blue-500 shadow-sm" 
                      : "bg-white border-gray-100 hover:border-blue-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  }`}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h3 className={`font-semibold transition-colors ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                        {item.name}
                      </h3>
                      {searchType === "foods" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{item.serving_size}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-xs font-medium text-orange-600 flex items-center gap-0.5">
                            <IoMdFlame /> {item.calories}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-blue-600 flex items-center gap-0.5 mt-1">
                          <IoMdFitness /> {item.met_value} MET
                        </span>
                      )}
                    </div>

                    {/* Selection Button */}
                    <button 
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                        isSelected 
                          ? "bg-blue-500 text-white shadow-md scale-110" 
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected ? <IoMdCheckmark className="text-xl" /> : <IoMdAdd className="text-xl" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Floating Batch Add Bar (Bottom) --- */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
          <div className="max-w-xl mx-auto">
            <div className="bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 duration-300 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl">
                  <RiShoppingBasketLine />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{selectedItems.length} items selected</p>
                  <p className="text-xs text-gray-400">{totalCalories} Cal total</p>
                </div>
              </div>
              
              <button 
                onClick={handleBatchAdd}
                className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Add All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Create Menu (Top Right) --- */}
      {showCreateMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setShowCreateMenu(false)} />
          <div className="absolute top-[80px] right-4 z-50 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in fade-in zoom-in-95 origin-top-right">
            <div onClick={() => navigate(`/create-ai?meal=${selectedMeal || ''}`)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><RiRobot2Line /></div>
              <span className="text-sm font-semibold text-gray-700">AI Track</span>
            </div>
            <div onClick={() => navigate(`/create-manual?meal=${selectedMeal || ''}`)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg"><RiEdit2Line /></div>
              <span className="text-sm font-semibold text-gray-700">Manual Entry</span>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default SearchPage;