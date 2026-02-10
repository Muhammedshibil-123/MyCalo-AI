import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  RiArrowLeftLine, 
  RiImageAddLine, 
  RiCloseCircleFill,
  RiCheckFill,
  RiErrorWarningFill
} from "react-icons/ri";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import api from "../../lib/axios";

const ManualEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // 1. Get Meal Type (Priority: URL -> Session -> Default)
  const getInitialMeal = () => {
    const urlMeal = searchParams.get("meal");
    if (urlMeal) return urlMeal.toUpperCase();
    
    const sessionMeal = sessionStorage.getItem("activeMeal"); 
    return sessionMeal ? sessionMeal.toUpperCase() : "SNACK";
  };

  const [mealType, setMealType] = useState(getInitialMeal());
  const [date, setDate] = useState(searchParams.get("date") || new Date().toISOString().split('T')[0]);

  // 2. Form State
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    user_serving_grams: "", // Critical for backend calc
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    sugar: "",
    sodium: "",
    cholesterol: ""
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3. Handle Text/Number Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  // 4. Handle Image Selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      
      // Generate previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 5. Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // --- VALIDATION ---
    const requiredFields = ['name', 'user_serving_grams', 'calories', 'protein', 'carbohydrates', 'fat'];
    const missing = requiredFields.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();

      // Append Text Data
      Object.keys(formData).forEach(key => {
        // Only append if value exists to avoid sending "undefined" strings
        if (formData[key]) {
          uploadData.append(key, formData[key]);
        }
      });

      // Append Context Data
      uploadData.append("meal_type", mealType);
      uploadData.append("date", date);

      // Append Images (Key must be 'images' plural)
      images.forEach((image) => {
        uploadData.append("images", image);
      });

      // API Call
      await api.post("/api/tracking/log-manual/", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Success
      navigate(`/search`);

    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.response?.data?.error || "Failed to log food. Please try again.");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-900">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
          >
            <RiArrowLeftLine className="text-xl" />
          </button>
          <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Manual Entry</span>
          <div className="w-10" /> 
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-6">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-100 animate-pulse">
            <RiErrorWarningFill className="text-xl shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">Food Images (Optional)</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              
              {/* Add Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors bg-white"
              >
                <RiImageAddLine className="text-2xl mb-1" />
                <span className="text-[10px] font-bold uppercase">Add Photo</span>
              </button>

              {/* Previews */}
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm group">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors backdrop-blur-sm"
                  >
                    <RiCloseCircleFill />
                  </button>
                </div>
              ))}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
          </div>

          {/* Basic Info Section */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Details</h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Food Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Homemade Chicken Curry"
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brand (Optional)</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Generic"
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Total Weight (g) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    name="user_serving_grams"
                    value={formData.user_serving_grams}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full h-12 pl-4 pr-8 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all font-bold text-gray-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Macros Section */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex justify-between">
              <span>Macronutrients</span>
              <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wide pt-1">Values for total weight</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Calories (kcal) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="calories"
                value={formData.calories}
                onChange={handleChange}
                placeholder="0"
                className="w-full h-14 px-4 rounded-xl bg-orange-50/50 border-transparent focus:bg-white focus:border-orange-500 focus:ring-0 transition-all font-black text-2xl text-orange-600 placeholder-orange-200"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Protein", name: "protein", color: "text-blue-600", bg: "focus:border-blue-500" },
                { label: "Carbs", name: "carbohydrates", color: "text-green-600", bg: "focus:border-green-500" },
                { label: "Fat", name: "fat", color: "text-orange-600", bg: "focus:border-orange-500" },
              ].map((macro) => (
                <div key={macro.name}>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 text-center">{macro.label} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      name={macro.name}
                      value={formData[macro.name]}
                      onChange={handleChange}
                      placeholder="0"
                      className={`w-full h-12 text-center rounded-xl bg-gray-50 border-transparent focus:bg-white ${macro.bg} focus:ring-0 transition-all font-bold ${macro.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Micros (Optional) */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Micros (Optional)</h3>
             <div className="grid grid-cols-2 gap-4">
                {['Fiber', 'Sugar', 'Sodium', 'Cholesterol'].map((label) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      type="number"
                      name={label.toLowerCase()}
                      value={formData[label.toLowerCase()]}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-gray-400 focus:ring-0 transition-all text-sm font-medium"
                    />
                  </div>
                ))}
             </div>
          </div>

          {/* Spacer for bottom button */}
          <div className="h-10"></div>
        </form>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${loading
                ? 'bg-gray-900 text-gray-500 cursor-not-allowed opacity-80' 
                : 'bg-black text-white shadow-xl shadow-gray-200 active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                <span>Saving Entry...</span>
              </>
            ) : (
              <>
                <RiCheckFill className="text-2xl" />
                <span>Log Food</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ManualEntry;