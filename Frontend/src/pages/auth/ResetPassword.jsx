import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import registerIllustration from "../../assets/images/register_illustration.webp";
import api from "../../lib/axios";

const ResetPassword = () => {
    // Shared State
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Password State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const inputsRef = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    // Redirect if accessed without email (from forgot-password page)
    useEffect(() => {
        if (!email) navigate("/forgot-password");
    }, [email, navigate]);

    const isOtpComplete = otp.every((d) => d !== "");

    // OTP Input Handlers (Same as VerifyEmailOtp.jsx)
    const handleChange = (e, index) => {
        const raw = e.target.value || "";
        const digits = raw.replace(/\D/g, "");
        if (digits === "") {
            const newOtp = [...otp];
            newOtp[index] = "";
            setOtp(newOtp);
            return;
        }
        const char = digits.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);
        setError("");
        if (index < 5) {
            requestAnimationFrame(() => {
                inputsRef.current[index + 1]?.focus();
            });
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
                inputsRef.current[index]?.focus();
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
            }
        }
    };

    // Step 1: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!isOtpComplete) return;

        setLoading(true);
        setError("");

        try {
            // Backend should verify the OTP and return 200
            const response = await api.post("/api/users/verify-reset-otp/", {
                email,
                otp: otp.join(""),
            });

            if (response.status === 200) {
                setIsOtpVerified(true); // Toggle the view
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid OTP code");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Change Password
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await api.post("/api/users/reset-password-confirm/", {
                email,
                otp: otp.join(""), // Re-sending OTP as proof of verification
                new_password: newPassword,
                confirm_password: confirmPassword
            });

            if (response.status === 200) {
                navigate("/login");
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full overflow-y-auto md:overflow-hidden no-scrollbar bg-white relative">
            {/* Background Image for Desktop */}
            <div className="hidden md:fixed md:inset-0 md:block relative">
                <img
                    src={registerIllustration}
                    alt="Reset Password"
                    className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                />
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <div className="relative z-10 h-full flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10 mx-4">
                    
                    {!isOtpVerified ? (
                        /* VIEW: OTP Verification */
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Verify OTP</h2>
                            <p className="text-gray-500 text-center mb-8">
                                Enter the 6-digit code sent to <span className="font-medium">{email}</span>
                            </p>

                            <div className="flex justify-between mb-8">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputsRef.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleChange(e, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-12 h-12 text-center text-xl rounded-xl border bg-gray-50 focus:ring-2 focus:ring-[#6C3AC9] outline-none"
                                    />
                                ))}
                            </div>

                            {error && <p className="text-sm text-red-500 font-medium text-center mb-4">{error}</p>}

                            <button
                                onClick={handleVerifyOtp}
                                disabled={!isOtpComplete || loading}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${isOtpComplete ? "bg-[#6C3AC9] text-white" : "bg-gray-300 text-gray-500"}`}
                            >
                                {loading ? "Verifying..." : "Verify Code"}
                            </button>
                        </>
                    ) : (
                        /* VIEW: New Password Form */
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Set New Password</h2>
                            <p className="text-gray-500 text-center mb-8">Create a strong password for your account</p>

                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                required
                            />

                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                required
                            />

                            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-white font-semibold shadow-lg bg-[#6C3AC9] disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Change Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;