import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { IoMdArrowBack, IoMdAdd } from 'react-icons/io';
import { RiCameraAiFill, RiSparklingFill } from 'react-icons/ri';

const AnalyzeImageResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve data passed from the Home page
  const resultData = location.state?.data;

  // Redirect if no data is present (e.g., user refreshed the page)
  if (!resultData) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <IoMdArrowBack className="text-xl text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <RiCameraAiFill className="text-blue-500" />
          Image Analysis
        </h1>
      </div>

      <div className="p-4 max-w-xl mx-auto">
        <ResultsView data={resultData} />
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: RESULTS VIEW (Reused Logic) ---
const ResultsView = ({ data }) => {
  const [aiText, setAiText] = useState("");
  const [isThinking, setIsThinking] = useState(true);
  
  const fullSuggestion = data.overall_suggestion || "";

  // Helper: Calculate Nutrient based on user serving size
  const calculateNutrient = (val100g, userServing) => {
    return Math.round((val100g * userServing) / 100);
  };

  // Logic: 2s Thinking -> Smooth Typing
  useEffect(() => {
    let typeInterval;
    
    // 1. Initial Delay ("Thinking Dots")
    const startDelay = setTimeout(() => {
      setIsThinking(false);

      // 2. Typewriter Effect
      let charIndex = -1;
      typeInterval = setInterval(() => {
        charIndex++;
        if (charIndex <= fullSuggestion.length) {
          setAiText(fullSuggestion.slice(0, charIndex));
        } else {
          clearInterval(typeInterval);
        }
      }, 15); // Speed

    }, 2000); 

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
          /* Loading Dots Animation */
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

      {/* 2. Instant Food Breakdown */}
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

export default AnalyzeImageResult;