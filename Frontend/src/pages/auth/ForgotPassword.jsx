import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import registerIllustration from "../../assets/images/register_illustration.webp";
import api from "../../lib/axios";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Adjust the endpoint according to your backend
            const response = await api.post("/api/users/forgot-password/", { email });
            if (response.status === 200) {
                navigate("/reset-password", { state: { email } });
            }
        } catch (err) {
            setError(err.response?.data?.detail || "User not found or something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full overflow-y-auto md:overflow-hidden no-scrollbar bg-white relative">
            {/* Mobile View */}
            <div className="md:hidden h-[40vh] w-full">
                <img src={registerIllustration} alt="Forgot Password" title="Source: muhammedshibil-123/mycalo-ai/MyCalo-AI-8d6ccfff14c4befc6d4a0914676922f29b5c8b40/Frontend/src/pages/auth/register.jsx" className="h-full w-full object-cover" />
            </div>
            <div className="md:hidden h-[60vh] px-6 py-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot Password</h2>
                <p className="text-gray-500 text-center mb-6">Enter email to receive OTP</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                        required
                    />
                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold shadow-lg bg-[#6C3AC9] disabled:opacity-50">
                        {loading ? "Sending..." : "Verify"}
                    </button>
                </form>
            </div>

            {/* Desktop View */}
            <div className="hidden md:fixed md:inset-0 md:block relative">
                <img src={registerIllustration} alt="Forgot Password" title="Source: muhammedshibil-123/mycalo-ai/MyCalo-AI-8d6ccfff14c4befc6d4a0914676922f29b5c8b40/Frontend/src/pages/auth/register.jsx" className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105" />
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot Password</h2>
                        <p className="text-gray-500 text-center mb-8">Enter email to receive OTP</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                required
                            />
                            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold shadow-lg bg-[#6C3AC9] disabled:opacity-50">
                                {loading ? "Sending..." : "Verify"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;