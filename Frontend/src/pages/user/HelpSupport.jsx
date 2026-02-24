import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiArrowDownSLine, RiMailSendLine, RiChatSmile3Line } from "react-icons/ri";

export default function HelpSupport() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    { 
      q: "How are my daily calories calculated?", 
      a: "We use your height, weight, age, gender, and activity level to calculate your Total Daily Energy Expenditure (TDEE) and adjust it based on your weight goals (Lose, Maintain, or Gain)." 
    },
    { 
      q: "How does the AI food scanner work?", 
      a: "You can click the camera icon on the home screen to take a picture or upload an image of your meal. Our AI will analyze the image and estimate the food items, calories, and macros." 
    },
    { 
      q: "Can I talk to a real doctor or nutritionist?", 
      a: "Yes! Navigate to the 'Consult' section in the app to connect directly with verified healthcare professionals and dietitians for personalized advice." 
    },
    { 
      q: "What is the AI Chat feature?", 
      a: "The AI Chat is your personal virtual health assistant. You can ask it questions about recipes, nutritional advice, or how to stick to your diet plan." 
    },
    { 
      q: "How do I log my meals manually?", 
      a: "On the home screen, click the '+' button next to a meal (Breakfast, Lunch, Dinner, Snack) or use the search bar to find a specific food and enter the portion size." 
    },
    { 
      q: "How do I update my weight?", 
      a: "You can update your current and target weight in the Edit Profile section. This will automatically log a new entry in your Weight History." 
    },
    { 
      q: "Can I change my macro goals?", 
      a: "Your protein, carbs, and fat goals are automatically calculated based on your primary fitness goal and weight. To change them, simply update your goal in your profile settings." 
    },
    { 
      q: "How do I edit or delete a logged food?", 
      a: "Go to your home screen, click the dropdown arrow on the food item you want to change, and click the edit (pencil) or delete (trash) icon." 
    },
    { 
      q: "What if a food is not in the search database?", 
      a: "If you can't find a food by searching, try taking a picture of it using our AI Vision scanner, or manually create a quick calorie entry if you know the nutritional values." 
    },
    { 
      q: "How can I track my overall progress?", 
      a: "You can view your calorie adherence, macro breakdown, and weight loss/gain trends in the Analytics dashboard available in the app." 
    },
    { 
      q: "Why did my daily calorie goal change suddenly?", 
      a: "If you updated your current weight, activity level, or changed your primary goal (e.g., from Weight Loss to Maintenance), the app will recalculate your required calories." 
    },
    { 
      q: "Do I need an internet connection for the AI features?", 
      a: "Yes. Analyzing food images and chatting with the AI requires an active internet connection to process the data securely on our servers." 
    },
    { 
      q: "How do I turn on daily reminder notifications?", 
      a: "You can manage your notification preferences in the Settings page to get reminders to log your meals or drink water." 
    },
    { 
      q: "Can I delete my account and data?", 
      a: "Yes. You can request account deletion from the Settings menu. Please note that this action is permanent and cannot be undone." 
    },
    { 
      q: "Is my personal health data private?", 
      a: "Absolutely. We use industry-standard encryption. Your health data, weight history, and chat logs are never shared with third parties without your explicit consent." 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 pb-20 md:pb-12">
      {/* Container: Expands from max-w-md on mobile to max-w-5xl on desktop */}
      <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-5xl px-4 sm:px-6 pt-6 md:pt-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 md:mb-10 animate-in fade-in duration-300">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm grid place-items-center hover:bg-gray-50 active:scale-95 transition cursor-pointer"
          >
            <RiArrowLeftLine className="text-xl" />
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Help & Support</h1>
        </div>

        {/* Flex layout for Desktop (Row) and Mobile (Column) */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Contact Banner - Sticky on Desktop */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-sky-500 p-6 md:p-8 text-white shadow-lg shadow-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-3">
              <RiChatSmile3Line className="text-3xl md:text-4xl" />
              <h2 className="text-lg md:text-xl font-extrabold">Need direct help?</h2>
            </div>
            <p className="text-sm md:text-base text-indigo-100 mb-6 opacity-90 leading-relaxed">
              Can't find the answer you're looking for? Our support team usually responds within 24 hours.
            </p>
            <a 
              href="mailto:sanuvkd104@gmail.com"
              className="w-full bg-white text-indigo-600 rounded-2xl py-3.5 md:py-4 font-extrabold text-sm md:text-base hover:bg-gray-50 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <RiMailSendLine className="text-xl" /> Email Support
            </a>
          </div>

          {/* FAQs List */}
          <div className="w-full lg:w-2/3 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
            <h3 className="text-sm md:text-base font-extrabold text-gray-500 uppercase tracking-wider mb-5 px-1">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3 md:space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl md:rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-gray-800 pr-4 md:text-lg">{faq.q}</span>
                    <RiArrowDownSLine
                      className={`text-xl md:text-2xl text-gray-400 transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? "rotate-180 text-indigo-500" : ""}`}
                    />
                  </button>
                  <div
                    className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaq === idx ? "max-h-64 pb-5 md:pb-6 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}