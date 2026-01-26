import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginIllustration from "../../assets/images/login_illustration.webp";
import { FcGoogle } from "react-icons/fc";
import api, { setAccessToken } from "../../lib/axios";

const Login = ({ setIsAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/users/login/", {
        username: email,
        password,
      });

      if (response.status === 200) {
        setAccessToken(response.data.access);
        localStorage.setItem("id", response.data.id);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("email", response.data.email);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("mobile", response.data.mobile);
        
        setIsAuth(true);
        navigate("/");
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white md:bg-transparent">
      {/* Mobile View */}
      <div className="md:hidden flex flex-col">
        <div className="w-full aspect-[4/3]">
          <img
            src={loginIllustration}
            alt="Login"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h2>

          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-3 rounded-xl shadow-sm mb-6">
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
              required
            />

            {error && (
              <div className="text-red-500 text-sm font-medium">{error}</div>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-[#6C3AC9]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold shadow-lg disabled:opacity-50 bg-[#6C3AC9]"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Not registered yet?{" "}
            <Link to="/register" className="text-[#6C3AC9] font-semibold">
              Create an Account
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:fixed md:inset-0 md:flex items-center justify-center">
        <img
          src={loginIllustration}
          alt="Login"
          className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h2>

          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-3 rounded-xl shadow-sm mb-6">
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
              required
            />

            {error && (
              <div className="text-red-500 text-sm font-medium">{error}</div>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-[#6C3AC9]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold shadow-lg disabled:opacity-50 bg-[#6C3AC9]"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-600 mt-6">
              Not registered yet?{" "}
              <Link to="/register" className="text-[#6C3AC9] font-semibold">
                Create an Account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;