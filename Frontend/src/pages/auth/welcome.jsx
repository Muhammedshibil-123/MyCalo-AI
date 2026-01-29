import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCircleChevronRight } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";

import imgMan from "../../assets/images/welcome_man.png";
import imgFood from "../../assets/images/welcome_food.png";
import imgFood2 from "../../assets/images/welcome_doctor.png";

const slides = [
  {
    title: "Welcome to MyCalo AI",
    text: "Your personal AI-powered native health & professional care ecosystem.",
    img: imgMan,
    sizeClass: "w-[85%] max-w-[520px] md:max-w-[380px] mb-10",
  },
  {
    title: "Track Native Foods",
    text: "AI accurately logs local dishes like Pazhampori and Chatti Choru.",
    img: imgFood,
    sizeClass: "w-[85%] max-w-[450px] md:max-w-[320px] mb-4",
  },
  {
    title: "Connect with Experts",
    text: "Chat with verified Doctors and Nutritionists for real-time advice.",
    img: imgFood2,
    sizeClass: "w-[100%] max-w-[480px] md:max-w-[350px]",
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const last = slides.length - 1;
  const current = slides[step];

  const next = () => {
    if (step === last) navigate("/login");
    else setStep((s) => s + 1);
  };

  const skip = () => navigate("/login");

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#FBF6FB]">
      {step !== last && (
        <button
          onClick={skip}
          className="absolute top-5 right-5 z-40 bg-white px-4 py-2 rounded-full text-sm font-medium shadow active:scale-95 transition-transform"
        >
          Skip
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="relative z-10 px-6 pt-20 max-w-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              {current.title}
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-600">
              {current.text}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[65%]">
            <svg
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              <path
                fill="#8B5CF6"
                d="M0,192L80,176C160,160,320,128,480,144C640,160,800,224,960,229.3C1120,235,1280,181,1360,154.7L1440,128L1440,320L0,320Z"
              />
            </svg>

            <div className="absolute inset-0 flex items-end justify-center pb-12">
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                src={current.img}
                alt=""
                className={`${current.sizeClass} object-contain`}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-white" : "w-4 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {step < last ? (
        <button
          onClick={next}
          className="absolute bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-[#6C3AC9] active:scale-90 transition-transform"
        >
          <FaCircleChevronRight className="text-2xl" />
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-4"
        >
          <button
            onClick={next}
            className="w-full max-w-md mb-4 py-4 rounded-full bg-[#6C3AC9] text-white text-lg font-semibold shadow-xl active:scale-95 transition-transform"
          >
            Get started
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Onboarding;
