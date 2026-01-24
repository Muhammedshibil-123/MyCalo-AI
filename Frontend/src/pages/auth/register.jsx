import { useState } from "react";
import { Link } from "react-router-dom";
import registerIllustration from "../../assets/images/register_illustration.webp";

import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa6";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ username, email, password, confirmPassword });
    };

    return (
        <div className="h-screen w-full overflow-y-auto md:overflow-hidden no-scrollbar bg-white relative">


            {/* ================= TOP RIGHT CORPORATE USER ================= */}
            <div className="absolute top-4 right-4 z-20">
                <Link
                    to="/corporate/register"
                    className="text-sm font-medium text-[#ebe5f5] hover:underline"
                >
                    Corporate user?
                </Link>
            </div>

            {/* ================= MOBILE IMAGE ================= */}
            <div className="md:hidden h-[40vh] w-full">
                <img
                    src={registerIllustration}
                    alt="Register"
                    className="h-full w-full object-cover"
                />
            </div>

            {/* ================= MOBILE FORM ================= */}
            <div className="md:hidden h-[60vh] px-6 py-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Sign Up
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                        required
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                        required
                    />

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    {/* TERMS TEXT */}
                    <p className="text-xs text-gray-500 leading-relaxed">
                        By signing up, I agree to the{" "}
                        <Link to="" className="underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="" className="underline">
                            Privacy Policy
                        </Link>
                        , including usage of Cookies.
                    </p>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-white font-semibold shadow-lg"
                        style={{ backgroundColor: "#6C3AC9" }}
                    >
                        Register
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[#6C3AC9] font-semibold">
                        Login
                    </Link>
                </p>
            </div>

            {/* ================= DESKTOP ================= */}
            <div className="hidden md:fixed md:inset-0 md:block relative">
                <img
                    src={registerIllustration}
                    alt="Register"
                    className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                />

                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Sign Up
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                required
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                required
                            />

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border focus:ring-1 focus:ring-[#6C3AC9]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 leading-relaxed">
                                By signing up, I agree to the{" "}
                                <Link to="" className="underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link to="" className="underline">
                                    Privacy Policy
                                </Link>
                                , including usage of Cookies.
                            </p>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl text-white font-semibold shadow-lg"
                                style={{ backgroundColor: "#6C3AC9" }}
                            >
                                Register
                            </button>
                            <p className="text-center text-sm text-gray-600 mt-6">
                                Already have an account?{" "}
                                <Link to="/login" className="text-[#6C3AC9] font-semibold">
                                    Login
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Register;
