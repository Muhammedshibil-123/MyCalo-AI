import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // adjust if your axios instance path differs
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(null);

  // form fields (add your existing profile fields too)
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const canSave = useMemo(() => {
    // basic check; adjust to your required fields
    return !saving;
  }, [saving]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/api/profiles/me/");
        if (!active) return;

        setProfile(res.data);
        setName(res.data?.name ?? "");
        setAge(res.data?.age ?? "");
        setHeight(res.data?.height ?? "");
        setWeight(res.data?.weight ?? "");
        setGoal(res.data?.goal ?? "");
        setPhotoPreview(res.data?.photo ?? null);
      } catch (e) {
        console.log(e);
        setError(
          e?.response?.data?.detail ||
            "Failed to load profile. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const onPickPhoto = (file) => {
    setPhotoFile(file);
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
      fd.append("name", name);

      // add other fields if you want editable here:
      if (age !== "") fd.append("age", age);
      if (height !== "") fd.append("height", height);
      if (weight !== "") fd.append("weight", weight);
      if (goal !== "") fd.append("goal", goal);

      if (photoFile) fd.append("photo", photoFile);

      const res = await api.patch("/api/profiles/update/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile(res.data);
      // if backend returns cloudinary URL, replace preview with true saved URL
      setPhotoPreview(res.data?.photo ?? photoPreview);
      setPhotoFile(null);
    } catch (e) {
      console.log(e);
      const data = e?.response?.data;
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-lg opacity-70">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-sm opacity-70">
            Update your personal details and profile photo.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition"
        >
          Back
        </button>
      </div>

      {error ? (
        <div className="mb-5 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Avatar Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl opacity-70">
                  {name?.trim()?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="font-medium">
                {name?.trim() || "Your Name"}
              </div>
              <div className="text-xs opacity-70">
                {profile?.user || " "}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm mb-2 opacity-80">Change photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/15"
            />
            <p className="text-xs opacity-60 mt-2">
              JPG/PNG recommended. Square photos look best.
            </p>
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Enter your name"
              />
              <Field
                label="Goal"
                value={goal}
                onChange={setGoal}
                placeholder="e.g., Fat loss / Muscle gain"
              />
              <Field
                label="Age"
                type="number"
                value={age}
                onChange={setAge}
                placeholder="e.g., 21"
              />
              <Field
                label="Height (cm)"
                type="number"
                value={height}
                onChange={setHeight}
                placeholder="e.g., 172"
              />
              <Field
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={setWeight}
                placeholder="e.g., 70"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                disabled={!canSave}
                className="px-5 py-2.5 rounded-2xl bg-white text-black font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // reset fields from profile
                  setName(profile?.name ?? "");
                  setAge(profile?.age ?? "");
                  setHeight(profile?.height ?? "");
                  setWeight(profile?.weight ?? "");
                  setGoal(profile?.goal ?? "");
                  setPhotoFile(null);
                  setPhotoPreview(profile?.photo ?? null);
                }}
                className="px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 transition"
              >
                Reset
              </button>
            </div>

            <div className="text-xs opacity-60">
              Tip: After saving, your questionnaire calculations can reuse these values.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm mb-2 opacity-80">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/20 outline-none focus:border-white/25 transition"
      />
    </div>
  );
}
