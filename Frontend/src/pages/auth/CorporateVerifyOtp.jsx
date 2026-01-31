import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/authslice";
import { IoMdArrowRoundBack } from "react-icons/io";
import corporateIllustration from "../../assets/images/corporate_illustration.webp";
import api, { setAccessToken } from "../../lib/axios";
import { Link } from "react-router-dom";

const CorporateVerifyOtp = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const email = location.state?.email || localStorage.getItem("otp_email");

    useEffect(() => {
        if (!email) navigate("/login");
    }, [email, navigate]);

    const isOtpComplete = otp.every((d) => d !== "");

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;

        const newOtp = [...otp];
        const char = val.slice(-1);
        newOtp[index] = char;
        setOtp(newOtp);
        setError("");


        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {

                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {

                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(data)) return;

        const newOtp = [...otp];
        data.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);

        const nextIndex = Math.min(data.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const verifyOtp = async (finalOtp = otp.join("")) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/api/users/corporate-verify-otp/", {
                email,
                otp: finalOtp,
            });

            const data = response.data;
            setAccessToken(data.access);

            const userDetails = {
                id: data.id,
                username: data.username,
                email: data.email,
                role: data.role,
                mobile: data.mobile,
            };

            dispatch(
                setCredentials({
                    accessToken: data.access,
                    user: userDetails,
                })
            );

            localStorage.setItem("user_details", JSON.stringify(userDetails));
            localStorage.removeItem("otp_email");

            const roleRedirect = {
                admin: "/admin/dashboard",
                employee: "/admin/dashboard", 
                doctor: "/doctor/dashboard",
            }

            navigate(roleRedirect[data.role] || "/");
        } catch (err) {
            const msg = err.response?.data;
            setError(
                msg
                    ? Array.isArray(Object.values(msg)[0])
                        ? Object.values(msg)[0][0]
                        : Object.values(msg)[0]
                    : "Verification failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isOtpComplete && !loading) {
            verifyOtp();
        }
    };

    return (
        <div className="h-screen w-full overflow-y-auto md:overflow-hidden bg-white relative">
            <div className="md:hidden absolute top-4 left-4 z-10">
                <button onClick={() => navigate("/login")}>
                    <IoMdArrowRoundBack className="text-2xl text-gray-700" />
                </button>
            </div>

            <div className="md:hidden px-6 pt-24 pb-28">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Security Check
                </h1>

                <p className="text-gray-500 mb-10 leading-relaxed">
                    Enter the 6-digit code generated in your Google Authenticator app for the{" "}
                    <span className="font-medium text-gray-800 break-all">{email}</span>{" "}
                    account.
                    <br />
                    <span className="text-sm">
                        Don’t have an authenticator set up?{" "}
                        <Link
                            to="/corporate/register"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Register again
                        </Link>
                    </span>
                </p>

                <div className="flex justify-between gap-2 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            onFocus={(e) => e.target.select()}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-[#6C3AC9] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-sm text-red-500 font-medium mb-3 text-center">{error}</p>
                )}
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white">
                <button
                    onClick={handleSubmit}
                    disabled={!isOtpComplete || loading}
                    className={`w-full py-4 rounded-xl text-lg font-semibold transition-all shadow-lg ${isOtpComplete
                        ? "bg-[#6C3AC9] text-white shadow-purple-200"
                        : "bg-gray-200 text-gray-400"
                        }`}
                >
                    {loading ? "Verifying..." : "Confirm Code"}
                </button>
            </div>

            <div className="hidden md:fixed md:inset-0 md:block relative">
                <img
                    src={corporateIllustration}
                    alt="Security Check"
                    className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                />
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl px-10 py-12">
                        <button
                            onClick={() => navigate("/login")}
                            className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <IoMdArrowRoundBack className="text-2xl text-gray-600" />
                        </button>

                        <div className="text-center mb-8 mt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                Security Check
                            </h1>
                            <p className="text-gray-500 leading-relaxed">
                                Enter the 6-digit code sent to{" "}
                                <span className="font-medium text-gray-800 block mt-1">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="flex justify-between gap-3 mb-8">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleChange(e, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onPaste={handlePaste}
                                        onFocus={(e) => e.target.select()}
                                        className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-[#6C3AC9] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-500 text-sm font-medium py-3 px-4 rounded-xl text-center mb-6">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!isOtpComplete || loading}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isOtpComplete
                                    ? "bg-[#6C3AC9] text-white shadow-purple-200"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {loading ? "Verifying..." : "Confirm Code"}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-400 mt-8">
                            Lost access to your device?{" "}
                            <button
                                onClick={() => navigate("/corporate/register")}
                                className="text-[#6C3AC9] font-semibold hover:underline"
                            >
                                Register again
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorporateVerifyOtp;