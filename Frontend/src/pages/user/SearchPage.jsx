import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoMdArrowBack, IoMdSearch, IoMdAdd, IoMdClose, IoMdRestaurant, IoMdArrowForward, IoMdFitness } from "react-icons/io";
import { RiRobot2Line, RiEdit2Line } from "react-icons/ri";
import { MdFastfood } from "react-icons/md";
import api from "../../lib/axios";

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
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{item.name}</h3>
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
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    if (selectedMeal) {
      sessionStorage.setItem("selectedMeal", selectedMeal);
    } else {
      sessionStorage.removeItem("selectedMeal");
    }
  }, [selectedMeal]);

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
        setShowCreateMenu(true);
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

      {showCreateMenu && (
        <>
          <div
            onClick={() => setShowCreateMenu(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 shadow-2xl animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
            
            {!selectedMeal && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Meal</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => (
                    <button
                      key={meal}
                      onClick={() => {
                        setSelectedMeal(meal.toLowerCase());
                        setShowCreateMenu(false);
                      }}
                      className="px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all active:scale-95"
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate(`/create-ai?meal=${selectedMeal || ''}`)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-2xl cursor-pointer transition-all group active:scale-98"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RiRobot2Line className="text-2xl text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">AI Track</p>
                  <p className="text-xs text-gray-500">Quick photo tracking</p>
                </div>
              </button>

              <button
                onClick={() => navigate(`/create-manual?meal=${selectedMeal || ''}`)}
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

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;