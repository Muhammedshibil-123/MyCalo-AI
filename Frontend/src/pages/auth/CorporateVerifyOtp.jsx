import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/authslice";
import { IoMdArrowRoundBack } from "react-icons/io";
import corporateIllustration from "../../assets/images/corporate_illustration.webp"; 
import api, { setAccessToken } from "../../lib/axios";

const CorporateVerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const email = location.state?.email;
  const secret = location.state?.secret;

  useEffect(() => {
    if (!email) navigate("/corporate/register");
  }, [email, navigate]);

  const isOtpComplete = otp.every((d) => d !== "");

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    setError("");

    if (val && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputsRef.current[Math.min(data.length, 5)].focus();
  };

  const verifyOtp = async (finalOtp = otp.join("")) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/users/corporate-verify-otp/", {
        email,
        otp: finalOtp,
      });

      if (response.status === 200) {
        const { access, role } = response.data;
        setAccessToken(access);
        
        dispatch(setCredentials({
            accessToken: access,
            user: {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email,
                role: response.data.role,
                mobile: response.data.mobile
            }
        }));

        if (role === 'admin') navigate("/admin/dashboard");
        else if (role === 'doctor') navigate("/doctor/dashboard");
        else if (role === 'employee') navigate("/employee/dashboard");
        else navigate("/");
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data ? (Array.isArray(Object.values(data)[0]) ? Object.values(data)[0][0] : Object.values(data)[0]) : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOtpComplete && !loading) {
      verifyOtp();
    }
  }, [otp]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 hidden md:block">
        <img src={corporateIllustration} alt="" className="w-full h-full object-cover blur-sm opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white md:shadow-2xl md:rounded-3xl p-8">
        <button onClick={() => navigate(-1)} className="mb-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <IoMdArrowRoundBack className="text-2xl text-gray-700" />
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Check</h1>
          <p className="text-gray-500">Enter the 6-digit code from your authenticator app</p>
        </div>

        {secret && (
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8 text-center">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Setup Key</span>
            <p className="text-xl font-mono font-bold text-purple-900 mt-1 select-all tracking-widest">{secret}</p>
          </div>
        )}

        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
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
              className="w-full aspect-square text-center text-2xl font-bold rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-[#6C3AC9] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium text-center mb-6 animate-shake">
            {error}
          </div>
        )}

        <button
          onClick={() => verifyOtp()}
          disabled={!isOtpComplete || loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none bg-[#6C3AC9]"
        >
          {loading ? "Verifying..." : "Confirm Code"}
        </button>
      </div>
    </div>
  );
};

export default CorporateVerifyOtp;