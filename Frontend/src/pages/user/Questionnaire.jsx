import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

/* =========================
   WHEEL PICKER - FIXED
   - centers items
   - hides scrollbar (requires global CSS .scrollbar-hide)
========================= */
const WheelPicker = ({ min, max, value, onChange, unit }) => {
  const containerRef = useRef(null);
  const itemHeight = 56;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const [isScrolling, setIsScrolling] = useState(false);

  // Scroll to selected value on mount and when value changes externally
  useEffect(() => {
    const index = values.indexOf(Number(value));
    if (index !== -1 && containerRef.current && !isScrolling) {
      const top = index * itemHeight;
      containerRef.current.scrollTo({ top: top, behavior: "smooth" });
    }
  }, [value, values, isScrolling]);

  // Detect center item while scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    setIsScrolling(true);
    
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.min(Math.max(index, 0), values.length - 1);
    const newValue = values[clampedIndex];
    
    if (newValue !== undefined && newValue !== Number(value)) {
      onChange(newValue);
    }
  };

  // Reset scrolling state after scroll ends
  useEffect(() => {
    let timeout;
    const container = containerRef.current;
    
    const resetScrolling = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    if (container) {
      container.addEventListener('scroll', resetScrolling);
      return () => {
        container.removeEventListener('scroll', resetScrolling);
        clearTimeout(timeout);
      };
    }
  }, []);

  return (
    <div className="relative w-full max-w-xs h-[280px] flex justify-center">
      {/* Top & bottom fade */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent z-10" />

      {/* Center selection lines */}
      <div className="absolute top-1/2 left-0 w-full h-14 -translate-y-1/2 border-y-2 border-emerald-500 z-20 pointer-events-none" />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide text-center"
      >
        {/* top padding so first value can center */}
        <div style={{ height: itemHeight * 2 }} />

        {values.map((val) => (
          <div
            key={val}
            className={`h-14 flex items-center justify-center snap-center text-3xl font-semibold transition-all ${
              Number(val) === Number(value) ? "text-emerald-600 scale-110" : "text-gray-400"
            }`}
          >
            {val}
            {unit && <span className="text-base ml-2">{unit}</span>}
          </div>
        ))}

        {/* bottom padding so last value can center */}
        <div style={{ height: itemHeight * 2 }} />
      </div>
    </div>
  );
};

/* =========================
   MAIN COMPONENT
========================= */
const Questionnaire = () => {
  const navigate = useNavigate();

  // Steps:
  // 0 Intro
  // 1 Name (new)
  // 2 Gender
  // 3 Age
  // 4 Height
  // 5 Current Weight
  // 6 Activity
  // 7 Goal
  // 8 Target Weight
  // 9 Medical Conditions
  // 10 Final Calculating (Animations)
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // Animation State
  const [loadingMessage, setLoadingMessage] = useState("Setting up...");
  const [isAnimating, setIsAnimating] = useState(false);

  const [formData, setFormData] = useState({
    name: "", // Added name field
    gender: "",
    age: 21,
    height: 170,
    weight: 70,
    target_weight: 65,
    activity_level: 1.2,
    goal: "",
    medical_conditions: [],
  });

  const medicalOptions = [
    "None",
    "Diabetes",
    "Pre-Diabetes",
    "Cholesterol",
    "Hypertension",
    "PCOS",
    "Thyroid",
    "Physical Injury",
    "Excessive stress/anxiety",
    "Sleep issues",
    "Depression",
    "Anger issues",
    "Loneliness",
    "Relationship stress",
  ];

  const updateData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMedical = (option) => {
    setFormData((prev) => {
      // if choosing None, clear other selections
      if (option === "None") return { ...prev, medical_conditions: ["None"] };

      // remove None if present and toggle this option
      const withoutNone = prev.medical_conditions.filter((c) => c !== "None");
      if (withoutNone.includes(option)) {
        return { ...prev, medical_conditions: withoutNone.filter((c) => c !== option) };
      } else {
        return { ...prev, medical_conditions: [...withoutNone, option] };
      }
    });
  };

  const nextStep = () => {
    // basic guard: don't go forward if invalid
    if (!isStepValid()) return;
    if (step < 10) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (isAnimating) return; // Prevent double submit
    setIsAnimating(true);

    try {
      // 1. Send Data to Backend
      const response = await api.patch("/api/profiles/update/", formData);
      console.log("Plan Generated:", response.data);

      // 2. Start the 4-second animation sequence
      setLoadingMessage("Setting up your profile...");
      
      setTimeout(() => {
        setLoadingMessage("Calculating TDEE & Macros...");
      }, 1500);

      setTimeout(() => {
        setLoadingMessage("Almost finished...");
      }, 3000);

      setTimeout(() => {
        navigate("/");
      }, 4500); // 4.5s total delay

    } catch (err) {
      console.error("submit error", err);
      setIsAnimating(false);
      // Optional: Show error toast here
    }
  };

  // when user arrives to final step, trigger submit
  useEffect(() => {
    if (step === 10) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // validation per-step
  const isStepValid = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return formData.name.trim().length > 0; // Require name to be filled
      case 2:
        return formData.gender === "M" || formData.gender === "F";
      case 3:
        return formData.age > 10 && formData.age < 120;
      case 4:
        return formData.height > 50 && formData.height < 250;
      case 5:
        return formData.weight > 20 && formData.weight < 400;
      case 6:
        return typeof formData.activity_level === "number";
      case 7:
        return formData.goal === "LOSE" || formData.goal === "MAINTAIN" || formData.goal === "GAIN";
      case 8:
        return formData.target_weight > 20 && formData.target_weight < 400;
      case 9:
        return true; // medical optional
      default:
        return true;
    }
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 200 : -200, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex justify-center items-center p-0 md:p-4">
      {/* Card */}
      <div className="w-full max-w-md flex flex-col h-screen md:h-auto md:min-h-[600px] bg-white md:rounded-3xl md:shadow-2xl relative overflow-hidden">

        {/* Progress (11 dots) - HIDDEN WHEN CALCULATING (Step 10) */}
        {step < 10 && (
          <div className="pt-6 pb-4 flex justify-center gap-2 px-4">
            {[...Array(11)].map((_, i) => (
              <div key={i} className={`h-2 flex-1 max-w-[24px] rounded-full transition-colors duration-300 ${i <= step ? "bg-emerald-600" : "bg-gray-200"}`} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-24 overflow-y-auto">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="w-full flex flex-col items-center text-center space-y-6 py-4"
            >
              {/* 0 - Intro */}
              {step === 0 && (
                <>
                  <div className="text-5xl">🥗</div>
                  <h2 className="text-2xl font-bold">Let's Set Up Your Calorie Goals</h2>
                  <p className="text-gray-500 max-w-xs">We need a few details to calculate your daily calorie target.</p>
                </>
              )}

              {/* 1 - Name */}
              {step === 1 && (
                <>
                  <h2 className="text-2xl font-semibold mb-2">What's your name?</h2>
                  <p className="text-sm text-gray-400 mb-4">So we know how to call you</p>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateData("name", e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full max-w-xs px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:bg-emerald-50 focus:ring-0 outline-none text-center text-xl font-medium transition-all"
                  />
                </>
              )}

              {/* 2 - Gender */}
              {step === 2 && (
                <>
                  <h2 className="text-2xl font-semibold">What's your biological sex?</h2>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    {["M", "F"].map((g) => (
                      <button
                        key={g}
                        onClick={() => updateData("gender", g)}
                        className={`h-32 rounded-2xl border-2 transition-all ${formData.gender === g ? "border-emerald-600 bg-emerald-50 scale-105" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="text-4xl">{g === "M" ? "♂️" : "♀️"}</span>
                          <span className="mt-2 font-semibold">{g === "M" ? "Male" : "Female"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 3 - Age */}
              {step === 3 && (
                <>
                  <h2 className="text-2xl font-semibold">What's your Age?</h2>
                  <WheelPicker min={18} max={80} value={formData.age} onChange={(v) => updateData("age", v)} />
                </>
              )}

              {/* 4 - Height */}
              {step === 4 && (
                <>
                  <h2 className="text-2xl font-semibold">How tall are you?</h2>
                  <WheelPicker min={140} max={210} value={formData.height} onChange={(v) => updateData("height", v)} unit="cm" />
                </>
              )}

              {/* 5 - Current Weight */}
              {step === 5 && (
                <>
                  <h2 className="text-2xl font-semibold">What's your current weight?</h2>
                  <WheelPicker min={30} max={200} value={formData.weight} onChange={(v) => updateData("weight", v)} unit="kg" />
                </>
              )}

              {/* 6 - Activity - IMPROVED DESIGN */}
              {step === 6 && (
                <>
                  <h2 className="text-2xl font-semibold mb-2">How active are you?</h2>
                  <p className="text-sm text-gray-400 mb-4">Select your typical daily activity level</p>
                  <div className="space-y-3 w-full max-w-xs">
                    {[
                      { val: 1.2, label: "Mostly Sitting", desc: "Desk work, minimal movement", emoji: "🪑" },
                      { val: 1.375, label: "Lightly Active", desc: "Standing work, light walking", emoji: "🚶" },
                      { val: 1.55, label: "Moderately Active", desc: "Regular walking & exercise", emoji: "🏃" },
                      { val: 1.725, label: "Very Active", desc: "Daily intense exercise", emoji: "🏋️" },
                      { val: 1.9, label: "Extremely Active", desc: "Physical job or athlete", emoji: "💪" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => updateData("activity_level", opt.val)}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          formData.activity_level === opt.val 
                            ? "border-emerald-600 bg-emerald-50 shadow-md" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{opt.emoji}</span>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-gray-800">{opt.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                          </div>
                          {formData.activity_level === opt.val && (
                            <div className="text-emerald-600">✓</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 7 - Goal */}
              {step === 7 && (
                <>
                  <h2 className="text-2xl font-semibold">What is your main goal?</h2>
                  <div className="space-y-4 w-full max-w-xs">
                    {[
                      { id: "LOSE", label: "Lose Weight", emoji: "🔥" },
                      { id: "MAINTAIN", label: "Maintain Weight", emoji: "⚖️" },
                      { id: "GAIN", label: "Build Muscle", emoji: "💪" },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => updateData("goal", g.id)}
                        className={`w-full p-5 rounded-2xl border-2 transition-all ${formData.goal === g.id ? "border-emerald-600 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{g.emoji}</span>
                          <div className="text-left">
                            <div className="font-semibold">{g.label}</div>
                            <div className="text-xs text-gray-500">{g.id === "LOSE" ? "Burn fat & get lean" : g.id === "MAINTAIN" ? "Stay healthy & fit" : "Gain mass & strength"}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 8 - Target Weight */}
              {step === 8 && (
                <>
                  <h2 className="text-2xl font-semibold">What's your target weight?</h2>
                  <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl max-w-xs">
                    Set a realistic target weight — you can always update it later.
                  </div>
                  <WheelPicker min={30} max={200} value={formData.target_weight} onChange={(v) => updateData("target_weight", v)} unit="kg" />
                </>
              )}

              {/* 9 - Medical Conditions - IMPROVED DESIGN */}
              {step === 9 && (
                <>
                  <h2 className="text-2xl font-semibold">Any medical conditions?</h2>
                  <p className="text-gray-500 text-sm max-w-xs">Select all that apply. This helps us personalize your plan safely.</p>

                  <div className="w-full max-w-xs mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {medicalOptions.map((opt) => {
                        const active = formData.medical_conditions.includes(opt);
                        const isNone = opt === "None";
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleMedical(opt)}
                            className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                              active 
                                ? isNone
                                  ? "bg-gray-600 text-white border-gray-600 shadow-md"
                                  : "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* 10 - Final Calculating (Animations) */}
              {step === 10 && (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                    className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full" 
                  />
                  
                  <motion.h3
                    key={loadingMessage} // Triggers animation when text changes
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xl font-bold text-gray-800"
                  >
                    {loadingMessage}
                  </motion.h3>
                  
                  <p className="text-gray-400 text-sm">Please wait while our AI builds your nutrition profile.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation (inside card so desktop looks correct) */}
        {step < 10 && (
          <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4 flex justify-between items-center z-10">
            <button 
              onClick={prevStep} 
              disabled={step === 0} 
              className={`font-semibold ${step === 0 ? "text-gray-300" : "text-emerald-600"}`}
            >
              BACK
            </button>

            <button
              onClick={nextStep}
              className={`px-6 py-3 rounded-full font-semibold transition-all shadow-sm ${isStepValid() ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md" : "bg-gray-200 text-gray-400"}`}
              disabled={!isStepValid()}
            >
              {step === 9 ? "FINISH" : "NEXT →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;