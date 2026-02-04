import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { IoMdArrowBack, IoMdFlame, IoMdCheckmark, IoMdNutrition } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Added loading icon
import { TbScale } from "react-icons/tb";
import api from "../../lib/axios";

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get meal and date from URL params (defaults provided if missing)
  const meal = searchParams.get("meal");
  const dateParam = searchParams.get("date");
  
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false); // State for the add button loading
  const [grams, setGrams] = useState(100);
  const [selectedUnit, setSelectedUnit] = useState("grams");

  const servingUnits = [
    { label: "100g", value: "grams", grams: 100 },
    { label: "Small Bowl", value: "small-bowl", grams: 150 },
    { label: "Medium Bowl", value: "medium-bowl", grams: 250 },
    { label: "Large Bowl", value: "large-bowl", grams: 350 },
    { label: "Cup", value: "cup", grams: 200 },
    { label: "Small Plate", value: "small-plate", grams: 180 },
    { label: "Large Plate", value: "large-plate", grams: 300 },
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

  const handleUnitChange = (unit) => {
    setSelectedUnit(unit.value);
    setGrams(unit.grams);
  };

  const handleGramsInput = (value) => {
    const numValue = parseFloat(value) || 0;
    setGrams(numValue);
    setSelectedUnit("custom");
  };

  // --- NEW: Handle Adding Food ---
  const handleAddFood = async () => {
    if (isAdding) return;
    setIsAdding(true);

    // 1. Artificial 1-second delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // 2. Prepare Data
      // Use date from URL or default to Today (YYYY-MM-DD)
      const dateToLog = dateParam || new Date().toISOString().split('T')[0];
      
      // Ensure meal type is Uppercase (e.g., "lunch" -> "LUNCH")
      const mealType = meal ? meal.toUpperCase() : "SNACK";

      const payload = {
        food_item: id,
        user_serving_grams: grams,
        meal_type: mealType,
        date: dateToLog,
      };

      // 3. API Call
      await api.post("/api/tracking/logs/", payload);

      // 4. Redirect to Search Page
      // Passing meal/date back allows the user to keep adding items to the same meal
      navigate(`/search?meal=${meal || 'snack'}&date=${dateToLog}`);

    } catch (error) {
      console.error("Error adding food to diary:", error);
      // Optional: You could add toast notification here
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoMdNutrition className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Food Not Found</h3>
          <p className="text-sm text-gray-500 mb-6">This item doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const baseGrams = 100;
  const multiplier = grams / baseGrams;

  const multipliedNutrients = {
    calories: Math.round(food.calories * multiplier),
    protein: (food.protein * multiplier).toFixed(1),
    carbohydrates: (food.carbohydrates * multiplier).toFixed(1),
    fat: (food.fat * multiplier).toFixed(1),
    fiber: (food.fiber * multiplier).toFixed(1),
    sugar: (food.sugar * multiplier).toFixed(1),
    sodium: Math.round(food.sodium * multiplier),
    cholesterol: Math.round(food.cholesterol * multiplier),
    saturated_fat: (food.saturated_fat * multiplier).toFixed(1),
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <IoMdArrowBack className="text-lg text-gray-700" />
          </button>
          <h1 className="text-sm font-semibold text-gray-900">Nutrition Facts</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{food.name}</h2>
              <p className="text-xs text-gray-500 font-medium">
                {food.brand || 'Generic'} • {food.serving_size}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ml-3 ${
              food.source === 'AI' ? 'bg-purple-100 text-purple-700' :
              food.source === 'ADMIN' ? 'bg-green-100 text-green-700' : 
              'bg-gray-100 text-gray-600'
            }`}>
              {food.source}
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <TbScale className="text-gray-400 text-lg" />
              <span className="text-xs font-semibold text-gray-700">Serving Size</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {servingUnits.map((unit) => (
                <button
                  key={unit.value}
                  onClick={() => handleUnitChange(unit)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    selectedUnit === unit.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
              <button
                onClick={() => setSelectedUnit("custom")}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  selectedUnit === "custom"
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                Custom
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <input
                type="number"
                value={grams}
                onChange={(e) => handleGramsInput(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold text-gray-900 focus:outline-none"
                placeholder="Enter grams"
              />
              <span className="text-sm font-semibold text-gray-500">grams</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Calories</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-bold">{multipliedNutrients.calories}</h3>
                <span className="text-lg font-medium text-gray-400">kcal</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <IoMdFlame className="text-3xl text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Macronutrients</h3>
          <div className="space-y-3">
            {[
              { label: "Protein", val: multipliedNutrients.protein, unit: "g" },
              { label: "Carbohydrates", val: multipliedNutrients.carbohydrates, unit: "g" },
              { label: "Fat", val: multipliedNutrients.fat, unit: "g" },
              { label: "Fiber", val: multipliedNutrients.fiber, unit: "g" }
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-600">{m.label}</span>
                <span className="text-sm font-bold text-gray-900">{m.val}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Micronutrients</h3>
          <div className="space-y-3">
            {[
              { label: "Sugar", val: multipliedNutrients.sugar, u: "g" },
              { label: "Sodium", val: multipliedNutrients.sodium, u: "mg" },
              { label: "Cholesterol", val: multipliedNutrients.cholesterol, u: "mg" },
              { label: "Saturated Fat", val: multipliedNutrients.saturated_fat, u: "g" }
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-600">{row.label}</span>
                <span className="text-sm font-bold text-gray-900">{row.val}{row.u}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleAddFood}
            disabled={isAdding}
            className={`w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              isAdding 
              ? 'bg-gray-800 text-gray-300 cursor-not-allowed' 
              : 'bg-gray-900 hover:bg-gray-800 text-white active:scale-98'
            }`}
          >
            {isAdding ? (
              <>
                <AiOutlineLoading3Quarters className="text-xl animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <IoMdCheckmark className="text-xl" />
                <span>Add to {meal ? meal.charAt(0).toUpperCase() + meal.slice(1) : 'Diary'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;