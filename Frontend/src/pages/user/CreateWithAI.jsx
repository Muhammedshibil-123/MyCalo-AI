import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowBack, IoMdAdd, IoMdWarning } from 'react-icons/io';
import { RiRobot2Line, RiSparklingFill } from 'react-icons/ri';
import api from '../../lib/axios';

const CreateWithAI = () => {
  const navigate = useNavigate();
  
  // State for managing views and data
  const [view, setView] = useState('input'); // 'input' | 'result'
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false); // Only for the button
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  // --- HANDLER: ANALYZE MEAL ---
  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    // 1. Start Button Loading (Page stays visible)
    setLoading(true);
    setError(null);

    try {
      // 2. Call API
      const response = await api.post('/nutrition/analyze/', { query: prompt });
      
      // 3. SUCCESS: Store data and switch view INSTANTLY
      setResultData(response.data);
      setView('result'); 
      
    } catch (err) {
      // 4. ERROR: Stay on 'input' view, stop loading, show error message
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
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => view === 'result' ? handleReset() : navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <RiRobot2Line className="text-blue-500" />
          Create with AI
        </h1>
      </div>

      <div className="p-4 max-w-xl mx-auto">
        {view === 'input' ? (
          /* ==================== VIEW 1: INPUT ==================== */
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className={`bg-white p-6 rounded-3xl shadow-sm border transition-colors ${error ? 'border-red-300' : 'border-gray-100'}`}>
              <label className="block text-gray-700 font-semibold mb-3">
                Describe your meal
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError(null); // Clear error when user types
                }}
                placeholder="e.g., One half mandhi with honey alfham with myonisee and tomoto suase..."
                className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
              
              {/* Error Message Section */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-sm font-medium animate-pulse">
                  <IoMdWarning className="text-lg mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Analyze Button - Handles Loading State Internally */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !prompt.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3
                ${loading || !prompt.trim() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
          <ResultsView data={resultData} />
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: RESULTS VIEW (Handles Animations) ---
const ResultsView = ({ data }) => {
  const [aiText, setAiText] = useState("");
  const [isThinking, setIsThinking] = useState(true);
  
  const fullSuggestion = data.overall_suggestion || "";

  // Helper: Calculate Nutrient based on user serving size
  const calculateNutrient = (val100g, userServing) => {
    return Math.round((val100g * userServing) / 100);
  };

  // Logic: 3s Thinking -> Smooth Typing
  useEffect(() => {
    let typeInterval;
    
    // 1. Initial 3s Delay ("Thinking Dots")
    const startDelay = setTimeout(() => {
      setIsThinking(false);

      // 2. Typewriter Effect (ChatGPT style)
      let charIndex = -1;
      typeInterval = setInterval(() => {
        charIndex++;
        if (charIndex <= fullSuggestion.length) {
          setAiText(fullSuggestion.slice(0, charIndex));
        } else {
          clearInterval(typeInterval);
        }
      }, 20); // Speed: 20ms per character

    }, 3000); // 3 Seconds wait

    return () => {
      clearTimeout(startDelay);
      clearInterval(typeInterval);
    };
  }, [fullSuggestion]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. AI Suggestion Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 min-h-[140px]">
        <h3 className="text-blue-900 font-bold mb-3 flex items-center gap-2">
          <RiSparklingFill className="text-blue-500" /> AI Insights
        </h3>
        
        {isThinking ? (
          /* Loading Dots Animation (3 Seconds) */
          <div className="flex items-center gap-1 h-6 pl-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
          </div>
        ) : (
          /* Typed Text */
          <p className="text-blue-800/90 text-sm leading-relaxed whitespace-pre-line font-medium">
            {aiText}
            {aiText.length < fullSuggestion.length && <span className="animate-pulse text-blue-500">|</span>}
          </p>
        )}
      </div>

      {/* 2. Instant Food Breakdown (Visible Immediately) */}
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-800">Meal Breakdown</h3>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {data.items.length} Items Found
            </span>
        </div>
        
        {data.items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 transition-transform active:scale-[0.99]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-gray-800 text-lg capitalize">{item.food_name}</h4>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {item.user_serving_size_g}g serving
                </span>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-bold text-indigo-600">
                  {calculateNutrient(item['100g_serving_size'].calories, item.user_serving_size_g)}
                </span>
                <span className="text-xs font-bold text-gray-400">KCAL</span>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-4 gap-2">
              <MacroItem 
                label="Protein" 
                value={calculateNutrient(item['100g_serving_size'].protein, item.user_serving_size_g)} 
                color="bg-green-50 text-green-700" 
              />
              <MacroItem 
                label="Carbs" 
                value={calculateNutrient(item['100g_serving_size'].carbs, item.user_serving_size_g)} 
                color="bg-orange-50 text-orange-700" 
              />
              <MacroItem 
                label="Fats" 
                value={calculateNutrient(item['100g_serving_size'].fats, item.user_serving_size_g)} 
                color="bg-yellow-50 text-yellow-700" 
              />
                <MacroItem 
                label="Fiber" 
                value={calculateNutrient(item['100g_serving_size'].fiber, item.user_serving_size_g)} 
                color="bg-purple-50 text-purple-700" 
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Sticky Add Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
        <button 
          onClick={() => console.log("Add to Log Logic Here")} 
          className="w-full max-w-xl mx-auto py-4 rounded-2xl font-bold text-white shadow-lg shadow-indigo-200 bg-gray-900 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98]"
        >
          <IoMdAdd className="text-xl" /> Add to Log
        </button>
      </div>
    </div>
  );
};

const MacroItem = ({ label, value, color }) => (
  <div className={`${color} rounded-xl p-2 flex flex-col items-center justify-center`}>
    <span className="font-bold text-sm">{value}g</span>
    <span className="text-[10px] opacity-70 uppercase tracking-wider">{label}</span>
  </div>
);

export default CreateWithAI;