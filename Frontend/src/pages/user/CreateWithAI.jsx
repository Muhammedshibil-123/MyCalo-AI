import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IoMdArrowBack, 
  IoMdAdd, 
  IoMdWarning, 
  IoMdCreate, 
  IoMdTrash, 
  IoMdCheckmark, 
  IoMdClose,
  IoMdInformationCircle
} from 'react-icons/io';
import { RiRobot2Line, RiSparklingFill, RiMagicLine } from 'react-icons/ri';
import api from '../../lib/axios';
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const CreateWithAI = () => {
  const navigate = useNavigate();
  
  const [view, setView] = useState('input'); // 'input' | 'result'
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  // --- HANDLER: ANALYZE MEAL ---
  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/nutrition/analyze/', { query: prompt });
      setResultData(response.data);
      setView('result'); 
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("We couldn't analyze that meal. Please check your internet or try a different description.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setView('input');
    setResultData(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center gap-4 transition-all">
        <button 
          onClick={() => view === 'result' ? handleReset() : navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-95"
        >
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <RiRobot2Line className="text-indigo-600" />
          Create with AI
        </h1>
      </div>

      <div className="p-4 max-w-xl mx-auto">
        {view === 'input' ? (
          /* ==================== VIEW 1: INPUT ==================== */
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className={`bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border transition-all ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                 <label className="text-gray-900 font-bold text-lg">
                   Describe your meal
                 </label>
                 <RiMagicLine className="text-indigo-500 text-xl" />
              </div>
              
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., One half mandhi with honey alfham with myonisee and tomoto suase..."
                className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium leading-relaxed"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-sm font-medium animate-pulse border border-red-100">
                  <IoMdWarning className="text-lg mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !prompt.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3
                ${loading || !prompt.trim() 
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-black hover:bg-gray-900 shadow-gray-300 active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RiSparklingFill className="text-xl" /> Analyze Meal
                </>
              )}
            </button>
          </div>
        ) : (
          /* ==================== VIEW 2: RESULTS ==================== */
          <ResultsView initialData={resultData} navigate={navigate} />
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: RESULTS VIEW ---
const ResultsView = ({ initialData, navigate }) => {
  const [data, setData] = useState(initialData);
  const [aiText, setAiText] = useState("");
  const [isThinking, setIsThinking] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  
  // State for Interactions
  const [editingIndex, setEditingIndex] = useState(null);
  const [editGrams, setEditGrams] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});

  const fullSuggestion = data.overall_suggestion || "";

  // Helper: Calculate Nutrient based on user serving size
  const calculateNutrient = (val100g, userServing) => {
    return Math.round((val100g * userServing) / 100);
  };

  // AI Typing Effect (3s Wait, then Fast Type)
  useEffect(() => {
    let typeInterval;
    // 1. Wait 3 Seconds
    const startDelay = setTimeout(() => {
      setIsThinking(false);
      let charIndex = -1;
      // 2. Type Faster (15ms per char)
      typeInterval = setInterval(() => {
        charIndex++;
        if (charIndex <= fullSuggestion.length) {
          setAiText(fullSuggestion.slice(0, charIndex));
        } else {
          clearInterval(typeInterval);
        }
      }, 15); 
    }, 3000); 

    return () => {
      clearTimeout(startDelay);
      clearInterval(typeInterval);
    };
  }, [fullSuggestion]);

  // --- ACTIONS ---
  
  const handleRemoveItem = (index) => {
    const updatedItems = data.items.filter((_, i) => i !== index);
    setData({ ...data, items: updatedItems });
  };

  const startEditing = (index, currentGrams) => {
    setEditingIndex(index);
    setEditGrams(currentGrams);
  };

  const saveEdit = (index) => {
    const updatedItems = [...data.items];
    updatedItems[index].user_serving_size_g = parseFloat(editGrams) || 0;
    setData({ ...data, items: updatedItems });
    setEditingIndex(null);
  };

  const toggleExpand = (index) => {
    // Only toggle if NOT editing
    if (editingIndex === null) {
      setExpandedItems(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    }
  };

  const handleAddToLog = async () => {
    if (data.items.length === 0) return;
    setIsLogging(true);
    
    const selectedMeal = sessionStorage.getItem("selectedMeal") || "SNACK";
    const selectedDate = sessionStorage.getItem("selectedDate") || new Date().toISOString().split('T')[0];

    await new Promise(r => setTimeout(r, 800));

    try {
      const payload = {
        meal_type: selectedMeal.toUpperCase(), 
        date: selectedDate,
        items: data.items,
        overall_suggestion: data.overall_suggestion
      };

      await api.post("/api/tracking/log-ai-meal/", payload);
      navigate('/'); 
      
    } catch (err) {
      console.error("Failed to log meal", err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* 1. AI Suggestion Box */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        
        <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2 relative z-10">
          <RiSparklingFill className="text-indigo-500" /> AI Insights
        </h3>
        
        {isThinking ? (
          <div className="flex items-center gap-1 h-6 pl-1">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
          </div>
        ) : (
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium relative z-10">
            {aiText}
            {aiText.length < fullSuggestion.length && <span className="animate-pulse text-indigo-500 font-bold ml-1">|</span>}
          </p>
        )}
      </div>

      {/* 2. Detected Items List */}
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-900 text-lg">Detected Items</h3>
            <span className="text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-full">
                {data.items.length} Found
            </span>
        </div>
        
        {data.items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
            <IoMdInformationCircle className="text-4xl text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm font-medium">No items left to log.</p>
          </div>
        ) : (
          data.items.map((item, idx) => {
            const isExpanded = expandedItems[idx];
            const p = calculateNutrient(item['100g_serving_size'].protein, item.user_serving_size_g);
            const c = calculateNutrient(item['100g_serving_size'].carbs, item.user_serving_size_g);
            const f = calculateNutrient(item['100g_serving_size'].fats, item.user_serving_size_g);
            const cal = calculateNutrient(item['100g_serving_size'].calories, item.user_serving_size_g);

            return (
              <div 
                key={idx} 
                onClick={() => toggleExpand(idx)}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md overflow-hidden cursor-pointer active:scale-[0.99]"
              >
                
                {/* Main Row: Always Visible */}
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    
                    {/* Left Side: Name & Minimalist Macros */}
                    <div className="flex-1 pr-2">
                      <h4 className="font-black text-gray-900 text-lg capitalize leading-tight mb-2">
                        {item.food_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <span className="text-blue-600">{p}g Protein</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-purple-600">{c}g Carbs</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-orange-600">{f}g Fats</span>
                      </div>
                    </div>

                    {/* Right Side: Calories & Controls */}
                    <div className="flex flex-col items-end gap-3">
                      
                      {/* Calories Badge */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">{cal}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">kcal</span>
                      </div>

                      {/* Controls Row - Prevents Expand on Click */}
                      <div 
                        className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100"
                        onClick={(e) => e.stopPropagation()} // Important: Stops card from expanding when clicking controls
                      >
                        {editingIndex === idx ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              autoFocus
                              value={editGrams}
                              onChange={(e) => setEditGrams(e.target.value)}
                              className="w-12 bg-white rounded-lg px-1 py-1 text-center font-bold text-gray-900 text-xs border border-gray-200 outline-none focus:border-indigo-500"
                            />
                            <button onClick={() => saveEdit(idx)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                              <IoMdCheckmark />
                            </button>
                            <button onClick={() => setEditingIndex(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                              <IoMdClose />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Grams Display (Click to Edit) */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(idx, item.user_serving_size_g);
                              }}
                              className="px-2 py-1 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                            >
                              {item.user_serving_size_g}g
                            </button>
                            
                            <div className="w-px h-3 bg-gray-200" />
                            
                            {/* Edit Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(idx, item.user_serving_size_g);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                            >
                              <IoMdCreate className="text-sm" />
                            </button>

                            <div className="w-px h-3 bg-gray-200" />
                            
                            {/* Delete Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(idx);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                            >
                              <IoMdTrash className="text-sm" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Nutritional Grid */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 animate-fade-in">
                    <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Fiber', val: item['100g_serving_size'].fiber },
                        { label: 'Sugar', val: item['100g_serving_size'].sugar },
                        { label: 'Sodium', val: item['100g_serving_size'].sodium, unit: 'mg' },
                        { label: 'Cholesterol', val: item['100g_serving_size'].cholesterol, unit: 'mg' },
                        { label: 'Sat. Fat', val: item['100g_serving_size'].saturated_fat },
                      ].map((nut, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-bold text-gray-800">
                            {calculateNutrient(nut.val, item.user_serving_size_g)}{nut.unit || 'g'}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{nut.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Sticky Add Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-40 safe-area-bottom">
        <button 
          onClick={handleAddToLog} 
          disabled={isLogging || data.items.length === 0}
          className={`w-full max-w-xl mx-auto py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]
            ${isLogging || data.items.length === 0
              ? 'bg-gray-900 cursor-not-allowed text-gray-500 opacity-80' 
              : 'bg-black hover:bg-gray-900 shadow-gray-200'
            }`}
        >
          {isLogging ? (
            <>
              <AiOutlineLoading3Quarters className="animate-spin text-xl" />
              Logging...
            </>
          ) : (
            <>
              <IoMdAdd className="text-xl" /> Add to Log
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateWithAI;