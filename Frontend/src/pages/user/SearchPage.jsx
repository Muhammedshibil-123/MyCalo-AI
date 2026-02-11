import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoMdArrowBack, IoMdSearch, IoMdClose, IoMdRestaurant, IoMdArrowForward, IoMdFitness, IoMdAdd } from "react-icons/io";
import { MdFastfood } from "react-icons/md";
import { RiVerifiedBadgeFill, RiArrowLeftSFill, RiArrowRightSFill, RiRobot2Line, RiEdit2Line } from "react-icons/ri"; 
import api from "../../lib/axios";

// --- MEAL SELECTION MODAL ---
const MealSelectionModal = ({ isOpen, onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
        <div className="text-center mb-6">
           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <IoMdRestaurant className="text-3xl text-blue-500" />
           </div>
           <h3 className="text-xl font-black text-gray-900">Select Meal</h3>
           <p className="text-sm text-gray-500">What are you logging right now?</p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
           {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => (
             <button
               key={meal}
               onClick={() => onSelect(meal.toLowerCase())}
               className="py-4 rounded-2xl font-bold text-lg bg-gray-50 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 text-gray-700 transition-all active:scale-95"
             >
               {meal}
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};

const SearchHeader = memo(({ onSearch, onBack, initialQuery }) => {
  const [localValue, setLocalValue] = useState(initialQuery);

  useEffect(() => {
    const handler = setTimeout(() => onSearch(localValue), 400);
    return () => clearTimeout(handler);
  }, [localValue, onSearch]);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <div className="relative flex-1">
          <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            value={localValue}
            autoFocus
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder="Search for food..."
            className="w-full bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl h-12 px-4 pl-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:from-white focus:to-white transition-all shadow-sm"
          />
        </div>
      </div>
    </div>
  );
});

const SearchResults = memo(({ results, searchType, loading, onItemClick }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mb-4 animate-bounce">
          <MdFastfood className="text-4xl text-blue-400" />
        </div>
        <p className="text-gray-400 text-sm font-medium">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 pb-32">
      {results.map((item) => {
        return (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="relative overflow-hidden p-4 rounded-2xl border bg-white border-gray-100 hover:border-blue-200 hover:shadow-md active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            {/* Main Flex Container - items-center ensures vertical centering of arrow */}
            <div className="flex items-center justify-between gap-3">
              
              <div className="flex-1 min-w-0">
                {/* --- TITLE ROW: Title+Badge LEFT | Votes RIGHT --- */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base truncate">
                            {item.name}
                        </h3>
                        {item.is_verified && (
                            <RiVerifiedBadgeFill className="text-blue-500 text-lg shrink-0" />
                        )}
                    </div>

                    {/* Votes Badge - Pushed to right end of this section */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 shrink-0">
                        <RiArrowLeftSFill className="text-gray-400 text-xs" />
                        <span className="text-[10px] font-bold text-[#EA580C] leading-none">{item.votes || 0}</span>
                        <RiArrowRightSFill className="text-gray-400 text-xs" />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    item.source === 'usda' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.source}
                  </span>
                </div>
                {searchType === "foods" ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">{item.serving_size} • {item.brand || 'Generic'}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                        {item.calories} Cal
                      </span>
                      <span className="text-gray-600">P: {item.protein}g</span>
                      <span className="text-gray-600">C: {item.carbohydrates}g</span>
                      <span className="text-gray-600">F: {item.fat}g</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">{item.met_value} MET</p>
                )}
              </div>

              {/* Right Arrow - Centered Vertically due to parent items-center */}
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all shrink-0">
                <IoMdArrowForward className="text-xl" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState("foods");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMeal, setSelectedMeal] = useState(() => {
    return sessionStorage.getItem("selectedMeal") || null;
  });
  
  const [showMealModal, setShowMealModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false); // Restored Menu State

  useEffect(() => {
    if (selectedMeal) {
      sessionStorage.setItem("selectedMeal", selectedMeal);
    } else {
      setShowMealModal(true);
    }
  }, [selectedMeal]);

  const handleMealSelect = (meal) => {
      setSelectedMeal(meal);
      setShowMealModal(false);
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await api.get("/api/search/", {
          params: { q: query, type: searchType }
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

  const handleItemClick = useCallback((item) => {
    if (searchType === "foods") {
      if (!selectedMeal) {
        setShowMealModal(true);
        return;
      }
      navigate(`/food/${item.id}?meal=${selectedMeal}`);
    } else {
      navigate(`/exercise/${item.id}`);
    }
  }, [navigate, selectedMeal, searchType]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SearchHeader
        initialQuery={query}
        onSearch={setQuery}
        onBack={() => navigate("/")}
      />

      <div className="sticky top-[73px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          {["foods", "exercises"].map(type => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${
                searchType === type 
                  ? "bg-white text-gray-900 shadow-md scale-105" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {selectedMeal && searchType === "foods" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
            <IoMdRestaurant className="text-blue-600 text-lg" />
            <span className="flex-1 text-sm font-bold text-blue-700 capitalize">{selectedMeal}</span>
            <button
              onClick={() => setSelectedMeal(null)}
              className="w-6 h-6 flex items-center justify-center bg-blue-200 hover:bg-blue-300 rounded-full transition-colors"
            >
              <IoMdClose className="text-blue-700 text-sm" />
            </button>
          </div>
        )}
      </div>

      <SearchResults
        results={results}
        searchType={searchType}
        loading={loading}
        onItemClick={handleItemClick}
      />

      {/* --- FLOATING ACTION BUTTON RESTORED --- */}
      {searchType === "foods" ? (
        <button
          onClick={() => setShowCreateMenu(true)}
          className="fixed bottom-6 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
        >
          <IoMdAdd className="text-3xl" />
        </button>
      ) : (
        <button
          onClick={() => navigate("/create-exercise")}
          className="fixed bottom-6 right-4 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
        >
          <IoMdFitness className="text-3xl" />
        </button>
      )}

      {/* --- RESTORED CREATE MENU (Without "Select Meal" Grid) --- */}
      {showCreateMenu && (
        <>
          <div
            onClick={() => setShowCreateMenu(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 shadow-2xl animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/create-ai?meal=${selectedMeal || ''}`)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-2xl cursor-pointer transition-all group active:scale-98"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RiRobot2Line className="text-2xl text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">Create With AI</p>
                  <p className="text-xs text-gray-500">Describe your meals in seconds</p>
                </div>
              </button>

              <button
                onClick={() => navigate(`/manual-entry`)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 rounded-2xl cursor-pointer transition-all group active:scale-98"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RiEdit2Line className="text-2xl text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">Manual Entry</p>
                  <p className="text-xs text-gray-500">Enter details manually</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* --- FORCED MEAL SELECTION POPUP --- */}
      <MealSelectionModal 
        isOpen={showMealModal} 
        onSelect={handleMealSelect} 
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;