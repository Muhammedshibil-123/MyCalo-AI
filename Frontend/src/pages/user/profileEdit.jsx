import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiCameraFill,
  RiImageFill,
  RiCloseLine,
  RiArrowRightSLine,
  RiQuestionnaireLine,
  RiUser3Line,
} from "react-icons/ri";

export default function ProfileEdit() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  // Read-only Macro Goals
  const [macros, setMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Mobile bottom-sheet for photo picker
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const canSave = useMemo(() => !saving, [saving]);

  const fetchProfile = useCallback(async () => {
    const res = await api.get("/api/profiles/me/");
    const data = res.data;

    setProfile(data);
    setName(data?.name ?? "");
    setAge(data?.age ?? "");
    setGender(data?.gender ?? "");
    setHeight(data?.height ?? "");
    setWeight(data?.weight ?? "");
    setTargetWeight(data?.target_weight ?? "");
    setActivityLevel(data?.activity_level ?? "");
    setPhotoPreview(data?.photo ?? null);

    setMacros({
      calories: data?.daily_calorie_goal ?? 0,
      protein: data?.protein_goal ?? 0,
      carbs: data?.carbs_goal ?? 0,
      fats: data?.fats_goal ?? 0,
    });
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        await fetchProfile();
      } catch (e) {
        console.log(e);
        if (!active) return;
        setError(
          e?.response?.data?.detail || "Failed to load profile. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchProfile]);

  const onPickPhoto = (file) => {
    setPhotoFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);
      setError("");

      const fd = new FormData();
      if (name) fd.append("name", name);
      if (age !== "") fd.append("age", age);
      if (gender !== "") fd.append("gender", gender);
      if (height !== "") fd.append("height", height);
      if (weight !== "") fd.append("weight", weight);
      if (targetWeight !== "") fd.append("target_weight", targetWeight);
      if (activityLevel !== "") fd.append("activity_level", activityLevel);
      if (photoFile) fd.append("photo", photoFile);

      await api.patch("/api/profiles/update/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Best UX: refresh data instantly (no full page reload)
      await fetchProfile();
      setPhotoFile(null);

      // If you REALLY want a full reload instead, uncomment:
      // window.location.reload();

    } catch (e2) {
      console.log(e2);
      const data = e2?.response?.data;
      setError(
        (typeof data === "string" && data) ||
          data?.detail ||
          "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 border border-gray-100">
          <div className="h-4 w-28 bg-gray-200 rounded-full animate-pulse" />
          <div className="mt-5 h-14 w-full bg-gray-200 rounded-2xl animate-pulse" />
          <div className="mt-3 h-14 w-5/6 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="mt-3 h-14 w-4/6 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900">
      {/* soft blobs like your Home page vibe */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute top-52 -right-24 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-md px-4 pt-5 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Keep your info updated for accurate goals
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-gray-800
                       ring-1 ring-gray-200 shadow-sm active:scale-[0.98] transition inline-flex items-center gap-2"
          >
            <RiArrowLeftLine className="text-base" />
            Back
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="mt-5 rounded-3xl bg-white/85 backdrop-blur border border-white shadow-[0_18px_60px_-35px_rgba(0,0,0,0.35)] overflow-hidden">
          {/* colorful header */}
          <div className="h-20 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

          <div className="-mt-10 px-5 pb-5">
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar (tap to open sheet) */}
                <button
                  type="button"
                  onClick={() => setPhotoSheetOpen(true)}
                  className="relative"
                  aria-label="Change profile photo"
                >
                  <div className="absolute -inset-1 rounded-full bg-white/70 blur" />
                  <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-white bg-gray-200 grid place-items-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <RiUser3Line className="text-2xl text-gray-500" />
                        <div className="text-xs font-extrabold text-gray-500 mt-0.5">
                          {name?.trim()?.[0]?.toUpperCase() || "U"}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white ring-1 ring-gray-200 shadow grid place-items-center">
                    <RiCameraFill className="text-gray-900" />
                  </div>
                </button>

                <div className="pb-1">
                  <h2 className="text-base font-extrabold leading-tight">
                    {name?.trim() || "Your Name"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {profile?.user || "User"}
                  </p>
                </div>
              </div>

              {/* Quick save small */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="rounded-2xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white
                           shadow-sm active:scale-[0.98] transition disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            {/* Macro Grid */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Daily Targets
                </h3>
                <span className="text-[11px] text-gray-500">Auto calculated</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MacroCard label="Calories" value={macros.calories} unit="kcal" tone="orange" />
                <MacroCard label="Protein" value={macros.protein} unit="g" tone="blue" />
                <MacroCard label="Carbs" value={macros.carbs} unit="g" tone="green" />
                <MacroCard label="Fats" value={macros.fats} unit="g" tone="yellow" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="mt-4 rounded-3xl bg-white/85 backdrop-blur border border-white shadow-[0_18px_60px_-35px_rgba(0,0,0,0.25)] p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Full Name" value={name} onChange={setName} placeholder="Enter your name" />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" type="number" value={age} onChange={setAge} placeholder="21" />
              <SelectField
                label="Gender"
                value={gender}
                onChange={setGender}
                options={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (cm)" type="number" value={height} onChange={setHeight} placeholder="172" />
              <Field label="Weight (kg)" type="number" value={weight} onChange={setWeight} placeholder="70" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Target (kg)" type="number" value={targetWeight} onChange={setTargetWeight} placeholder="65" />
              <SelectField
                label="Activity"
                value={activityLevel}
                onChange={setActivityLevel}
                options={[
                  { label: "Sedentary", value: "Sedentary" },
                  { label: "Light", value: "Lightly Active" },
                  { label: "Moderate", value: "Moderately Active" },
                  { label: "Very", value: "Very Active" },
                  { label: "Extra", value: "Extra Active" },
                ]}
              />
            </div>

            {/* Main button */}
            <button
              type="submit"
              disabled={!canSave}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 py-3 text-sm font-extrabold text-white
                         shadow-lg shadow-gray-900/20 active:scale-[0.99] transition
                         disabled:opacity-60 disabled:shadow-none"
            >
              {saving ? "Saving changes..." : "Save Changes"}
            </button>

            <p className="text-[11px] text-gray-500 text-center">
              Saved changes will instantly reflect (we refetch profile after save).
            </p>
          </form>
        </div>

        {/* Questionnaire CTA */}
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white/90 backdrop-blur p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 grid place-items-center ring-1 ring-indigo-100">
              <RiQuestionnaireLine className="text-indigo-600 text-xl" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-extrabold text-gray-900">
                Want to finish your Questionnaire?
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                It helps us calculate your calories and macros more accurately.
              </p>

              <button
                type="button"
                onClick={() => navigate("/questionnaire")}
                className="mt-3 w-full rounded-2xl bg-indigo-600 text-white py-3 text-sm font-extrabold
                           shadow-md shadow-indigo-600/20 active:scale-[0.99] transition inline-flex items-center justify-center gap-2"
              >
                Go to Questionnaire <RiArrowRightSLine className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PHOTO PICKER SHEET (Mobile) */}
      {photoSheetOpen && (
        <div
          onClick={() => setPhotoSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl animate-fade-in-up"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">Change photo</h3>
              <button
                onClick={() => setPhotoSheetOpen(false)}
                className="h-10 w-10 rounded-2xl bg-gray-100 grid place-items-center active:scale-95 transition"
              >
                <RiCloseLine className="text-xl text-gray-700" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mt-1">
              Choose a source (camera or gallery).
            </p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPhotoSheetOpen(false);
                  cameraInputRef.current?.click();
                }}
                className="w-full rounded-2xl bg-gray-900 text-white py-3 font-extrabold text-sm
                           active:scale-[0.99] transition inline-flex items-center justify-center gap-2"
              >
                <RiCameraFill className="text-lg" />
                Camera
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhotoSheetOpen(false);
                  galleryInputRef.current?.click();
                }}
                className="w-full rounded-2xl bg-gray-100 text-gray-900 py-3 font-extrabold text-sm
                           ring-1 ring-gray-200 active:scale-[0.99] transition inline-flex items-center justify-center gap-2"
              >
                <RiImageFill className="text-lg" />
                Gallery
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
            />

            {/* On mobile this opens camera directly */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
            />

            <button
              type="button"
              onClick={() => setPhotoSheetOpen(false)}
              className="mt-4 w-full py-3 rounded-2xl font-extrabold text-sm text-gray-500 hover:bg-gray-50 active:scale-[0.99] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Input Field */
function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-extrabold text-gray-700 pl-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900
                   placeholder:text-gray-400 outline-none
                   focus:border-gray-300 focus:ring-4 focus:ring-indigo-100 transition"
      />
    </div>
  );
}

/** Select Dropdown */
function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-extrabold text-gray-700 pl-1">{label}</label>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900
                     outline-none focus:border-gray-300 focus:ring-4 focus:ring-indigo-100 transition"
        >
          <option value="" disabled>
            Select...
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Colorful Macro Card */
function MacroCard({ label, value, unit, tone = "orange" }) {
  const tones = {
    orange: {
      bg: "from-orange-500/15 to-orange-500/0",
      ring: "ring-orange-200",
      dot: "bg-orange-500",
      text: "text-orange-700",
    },
    blue: {
      bg: "from-sky-500/15 to-sky-500/0",
      ring: "ring-sky-200",
      dot: "bg-sky-500",
      text: "text-sky-700",
    },
    green: {
      bg: "from-emerald-500/15 to-emerald-500/0",
      ring: "ring-emerald-200",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
    },
    yellow: {
      bg: "from-amber-500/15 to-amber-500/0",
      ring: "ring-amber-200",
      dot: "bg-amber-500",
      text: "text-amber-700",
    },
  };

  const t = tones[tone] || tones.orange;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden ring-1 ring-gray-100">
      <div className={`h-full p-4 bg-gradient-to-br ${t.bg} ring-1 ${t.ring}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${t.dot}`} />
            <span className="text-xs font-extrabold text-gray-700">{label}</span>
          </div>

          <span className="text-[10px] px-2 py-1 rounded-full bg-white/80 text-gray-600 ring-1 ring-gray-200 font-bold">
            target
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold tracking-tight ${t.text}`}>
            {value || 0}
          </span>
          <span className="text-xs text-gray-500 font-semibold">{unit}</span>
        </div>
      </div>
    </div>
  );
}
