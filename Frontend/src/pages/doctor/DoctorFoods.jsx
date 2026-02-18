import React, { useState, useEffect, useCallback } from "react";
import { 
  IoMdSearch, IoMdAdd, IoMdClose, IoMdRestaurant, IoMdFitness, 
  IoMdArrowForward, IoMdFlame, IoMdNutrition 
} from "react-icons/io";
import { RiVerifiedBadgeFill, RiScales3Fill } from "react-icons/ri";
import { MdFastfood, MdSportsGymnastics } from "react-icons/md";
import api from "../../lib/axios";

// --- DETAIL MODAL (Replaces navigation to detail page) ---
const ItemDetailModal = ({ item, type, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="bg-blue-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <IoMdClose size={20} />
          </button>
          <div className="flex items-start gap-4">
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                {type === 'foods' ? <IoMdRestaurant size={32} /> : <IoMdFitness size={32} />}
             </div>
             <div>
                <h3 className="text-xl font-bold leading-tight mb-1">{item.name}</h3>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                   <span className="capitalize bg-blue-700/50 px-2 py-0.5 rounded text-xs">{item.source || 'Database'}</span>
                   {item.is_verified && <span className="flex items-center gap-1"><RiVerifiedBadgeFill /> Verified</span>}
                </div>
             </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {type === 'foods' ? (
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Calories</p>
                     <p className="text-2xl font-black text-gray-900 flex items-center gap-1">
                        {item.calories} <span className="text-sm font-normal text-gray-400">kcal</span>
                     </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Serving</p>
                     <p className="text-lg font-bold text-gray-900 truncate">
                        {item.serving_size || '1 unit'}
                     </p>
                  </div>
               </div>

               <div>
                 <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <IoMdNutrition className="text-blue-500" /> Macros
                 </p>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 text-center">
                        <p className="text-xs text-orange-600 font-bold mb-1">Protein</p>
                        <p className="font-black text-gray-800">{item.protein}g</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                        <p className="text-xs text-blue-600 font-bold mb-1">Carbs</p>
                        <p className="font-black text-gray-800">{item.carbohydrates}g</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
                        <p className="text-xs text-yellow-600 font-bold mb-1">Fats</p>
                        <p className="font-black text-gray-800">{item.fat}g</p>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="text-center py-6">
               <div className="inline-block p-4 rounded-full bg-green-50 text-green-600 mb-4">
                  <IoMdFlame size={40} />
               </div>
               <h4 className="text-lg font-bold text-gray-900 mb-2">Metabolic Equivalent</h4>
               <p className="text-4xl font-black text-gray-900 mb-2">{item.met_value}</p>
               <p className="text-gray-500 text-sm">MET Value</p>
            </div>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-100">
            <button 
                disabled
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
            >
                Add to Patient Plan <span className="text-[10px] uppercase border border-gray-300 px-1 rounded ml-1">Soon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorFoods = () => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("foods");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchType]);

  const fetchResults = async () => {
    // If empty query, maybe show recent or popular? For now, empty list
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
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    console.log("Add button clicked - functionality to be implemented");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      
      {/* --- HEADER SECTION --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 lg:px-8 lg:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
            
            {/* Title & Tabs */}
            <div className="flex flex-col gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Database Manager</h1>
                    <p className="text-gray-500 text-sm">Search and manage food & exercise records</p>
                </div>
                
                {/* Type Toggles */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-fit self-start">
                    <button 
                        onClick={() => setSearchType('foods')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${searchType === 'foods' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <IoMdRestaurant /> Foods
                    </button>
                    <button 
                        onClick={() => setSearchType('exercises')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${searchType === 'exercises' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <IoMdFitness /> Exercises
                    </button>
                </div>
            </div>

            {/* Search Bar & Desktop Add Button */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-96 group">
                    <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchType === 'foods' ? "Search for foods, brands..." : "Search for exercises..."}
                        className="w-full h-12 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-11 pr-4 text-sm transition-all outline-none"
                    />
                </div>
                
                {/* Desktop Add Button */}
                <button 
                    onClick={handleAddClick}
                    className="hidden lg:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                    <IoMdAdd size={20} />
                    <span>Add New</span>
                </button>
            </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
            
            {loading ? (
                // Skeleton Loader
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                            <div className="h-8 bg-gray-50 rounded-lg w-full mt-4"></div>
                        </div>
                    ))}
                </div>
            ) : results.length > 0 ? (
                // Results Grid
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20 lg:pb-0">
                    {results.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.source === 'usda' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                                            {item.source}
                                        </span>
                                        {item.brand && <span className="text-xs text-gray-400 truncate max-w-[100px]">• {item.brand}</span>}
                                    </div>
                                </div>
                                {searchType === 'foods' && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-gray-900">{item.calories}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Kcal</span>
                                    </div>
                                )}
                            </div>

                            {searchType === 'foods' ? (
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500 font-bold">PRO</div>
                                        <div className="text-xs font-black text-gray-900">{item.protein}g</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500 font-bold">CARB</div>
                                        <div className="text-xs font-black text-gray-900">{item.carbohydrates}g</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-[10px] text-gray-500 font-bold">FAT</div>
                                        <div className="text-xs font-black text-gray-900">{item.fat}g</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 bg-green-50 rounded-xl p-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-green-800">Intensity Level</span>
                                    <span className="text-sm font-black text-green-700">{item.met_value} MET</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        {searchType === 'foods' ? <MdFastfood size={40} /> : <MdSportsGymnastics size={40} />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 max-w-sm">Try searching for a different item or check your spelling.</p>
                </div>
            )}
        </div>
      </div>

      {/* --- MOBILE FAB (ADD BUTTON) --- */}
      <button 
        onClick={handleAddClick}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <IoMdAdd size={28} />
      </button>

      {/* --- DETAILS MODAL --- */}
      {selectedItem && (
        <ItemDetailModal 
            item={selectedItem} 
            type={searchType} 
            onClose={() => setSelectedItem(null)} 
        />
      )}

      {/* --- ANIMATIONS STYLES --- */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default DoctorFoods;