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

  const email =
    location.state?.email || localStorage.getItem("otp_email");

  useEffect(() => {
    if (!email) navigate("/login");
  }, [email, navigate]);

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

      const data = response.data;

      setAccessToken(data.access);

      dispatch(
        setCredentials({
          accessToken: data.access,
          user: {
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
            mobile: data.mobile,
          },
        })
      );

      localStorage.removeItem("otp_email");

      const roleRedirect = {
        admin: "/admin/dashboard",
        doctor: "/doctor/dashboard",
        employee: "/employee/dashboard",
      };

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

  useEffect(() => {
    if (otp.every((d) => d !== "") && !loading) {
      verifyOtp();
    }
  }, [otp]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 hidden md:block">
        <img
          src={corporateIllustration}
          className="w-full h-full object-cover blur-sm opacity-40"
        />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white md:shadow-2xl md:rounded-3xl p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 p-2 hover:bg-gray-100 rounded-full"
        >
          <IoMdArrowRoundBack className="text-2xl text-gray-700" />
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Security Check
          </h1>
          <p className="text-gray-500">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <div
          className="flex justify-between gap-2 mb-8"
          onPaste={handlePaste}
        >
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
              className="w-full aspect-square text-center text-2xl font-bold rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-[#6C3AC9] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium text-center mb-6">
            {error}
          </div>
        )}

        <button
          onClick={() => verifyOtp()}
          disabled={otp.some((d) => d === "") || loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-50 bg-[#6C3AC9]"
        >
          {loading ? "Verifying..." : "Confirm Code"}
        </button>
      </div>
    </div>
  );
};

export default CorporateVerifyOtp;
