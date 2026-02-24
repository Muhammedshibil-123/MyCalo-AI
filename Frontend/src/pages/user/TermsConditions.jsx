import React from "react";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiFileList3Fill } from "react-icons/ri";

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="mx-auto w-full max-w-2xl flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-gray-100 grid place-items-center active:scale-95 transition"
          >
            <RiArrowLeftLine className="text-xl" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-extrabold leading-tight">Terms & Conditions</h1>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Last Updated: Feb 2026</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-5 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-sm ring-1 ring-amber-200">
          <RiFileList3Fill />
        </div>

        <div className="prose prose-sm md:prose-base prose-gray">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Welcome to MyCalo AI. By accessing or using our application, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-xl font-extrabold text-gray-900 mb-3">2. Health Disclaimer</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            The calorie tracking and AI nutritional advice provided by this app are for informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider.
          </p>

          <h2 className="text-xl font-extrabold text-gray-900 mb-3">3. User Data & Privacy</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We store your dietary logs, bodily measurements, and photos to provide accurate calculations. We will not sell your personal health data to third-party marketers. For more information, please review our Privacy Policy.
          </p>

          <h2 className="text-xl font-extrabold text-gray-900 mb-3">4. Account Responsibilities</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
          </p>

          <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 text-center">
            <p className="text-sm font-bold text-gray-700">
              By continuing to use MyCalo AI, you acknowledge that you have read and understood these terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}