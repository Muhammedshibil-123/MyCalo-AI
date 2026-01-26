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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpComplete) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/users/corporate-verify-otp/", {
        email,
        otp: otp.join(""),
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
      if (err.response?.data) {
        const data = err.response.data;
        const first = Object.values(data)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto md:overflow-hidden bg-white relative">
      <div className="md:hidden absolute top-4 left-4 z-10">
        <button onClick={() => navigate("/corporate/register")}>
          <IoMdArrowRoundBack className="text-2xl text-gray-700" />
        </button>
      </div>

      <div className="md:hidden px-6 pt-24 pb-28">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Google Authenticator</h1>

        <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700 font-semibold mb-2">Setup Key:</p>
            <p className="text-lg font-mono tracking-widest text-[#6C3AC9] break-all select-all">
                {secret}
            </p>
            <p className="text-xs text-gray-500 mt-2">
                Enter this key in your Google Authenticator app.
            </p>
        </div>

        <p className="text-gray-500 mb-6">
          Enter the 6-digit code from Google Authenticator
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
              className="w-14 h-14 text-center text-2xl rounded-xl border bg-gray-50 focus:ring-2 focus:ring-[#6C3AC9] outline-none"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium mb-3">{error}</p>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white">
        <button
          onClick={handleSubmit}
          disabled={!isOtpComplete || loading}
          className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${isOtpComplete ? "bg-[#6C3AC9] text-white" : "bg-gray-300 text-gray-500"
            }`}
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </button>
      </div>

      <div className="hidden md:fixed md:inset-0 md:block relative">
        <img
          src={corporateIllustration}
          alt="OTP"
          className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">
            <button onClick={() => navigate("/corporate/register")}>
              <IoMdArrowRoundBack className="text-2xl text-gray-700" />
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Google Authenticator
            </h1>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-center">
                <p className="text-sm text-gray-700 font-semibold mb-2">Setup Key:</p>
                <p className="text-lg font-mono tracking-widest text-[#6C3AC9] break-all select-all">
                    {secret}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Enter this key in your Google Authenticator app.
                </p>
            </div>

            <p className="text-gray-500 text-center mb-8">
              Enter the 6-digit code from Google Authenticator
            </p>

            <form onSubmit={handleSubmit}>
              <div className="flex justify-between mb-6">
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

              {error && (
                <p className="text-sm text-red-500 font-medium text-center mb-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={!isOtpComplete || loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${isOtpComplete ? "bg-[#6C3AC9] text-white" : "bg-gray-300 text-gray-500"
                  }`}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateVerifyOtp;