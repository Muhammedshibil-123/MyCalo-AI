import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import registerIllustration from "../../assets/images/register_illustration.webp";

const VerifyEmailOtp = () => {
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const inputsRef = useRef([]);
    const navigate = useNavigate();

    const isOtpComplete = otp.every((d) => d !== "");

    useEffect(() => {
        if (timer === 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    const handleResend = () => {
        setTimer(30);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isOtpComplete) return;
        console.log("OTP:", otp.join(""));
    };

    return (
        <div className="h-screen w-full overflow-y-auto md:overflow-hidden bg-white relative">

            <div className="md:hidden absolute top-4 left-4 z-10">
                <button onClick={() => navigate("/register")}>
                    <IoMdArrowRoundBack className="text-2xl text-gray-700" />
                </button>
            </div>

            <div className="md:hidden px-6 pt-24 pb-28">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Enter your OTP
                </h1>

                <p className="text-gray-500 mb-10">
                    We have sent a 4-digit OTP to your email
                    <span className="text-[#6C3AC9] font-medium cursor-pointer ml-1">
                        edit
                    </span>
                </p>

                <div className="flex justify-between mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputsRef.current[index] = el)}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-16 h-16 text-center text-2xl rounded-xl border bg-gray-50 focus:ring-2 focus:ring-[#6C3AC9] outline-none"
                        />
                    ))}
                </div>

                <p className="text-sm text-gray-500">
                    Didn’t receive it?
                    {timer > 0 ? (
                        <span className="font-medium"> Resend in {timer} sec</span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-[#6C3AC9] font-medium ml-1"
                        >
                            Resend
                        </button>
                    )}
                </p>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white">
                <button
                    onClick={handleSubmit}
                    disabled={!isOtpComplete}
                    className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${isOtpComplete
                            ? "bg-[#6C3AC9] text-white"
                            : "bg-gray-300 text-gray-500"
                        }`}
                >
                    Sign Up
                </button>
            </div>

            <div className="hidden md:fixed md:inset-0 md:block relative">
                <img
                    src={registerIllustration}
                    alt="OTP"
                    className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                />

                <div className="absolute inset-0 bg-black/20"></div>

                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">
                        <button onClick={() => navigate("/register")}>
                            <IoMdArrowRoundBack className="text-2xl text-gray-700" />
                        </button>

                        <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                            Enter your OTP
                        </h1>

                        <p className="text-gray-500 text-center mb-8">
                            We have sent a 4-digit OTP to your email
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="flex justify-between mb-6">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputsRef.current[index] = el)}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className="w-14 h-14 text-center text-xl rounded-xl border bg-gray-50 focus:ring-2 focus:ring-[#6C3AC9] outline-none"
                                    />
                                ))}
                            </div>

                            <p className="text-sm text-gray-500 text-center mb-6">
                                Didn’t receive it?
                                {timer > 0 ? (
                                    <span className="font-medium"> Resend in {timer} sec</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        className="text-[#6C3AC9] font-medium ml-1"
                                    >
                                        Resend
                                    </button>
                                )}
                            </p>

                            <button
                                type="submit"
                                disabled={!isOtpComplete}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${isOtpComplete
                                        ? "bg-[#6C3AC9] text-white"
                                        : "bg-gray-300 text-gray-500"
                                    }`}
                            >
                                Sign Up
                            </button>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default VerifyEmailOtp;
