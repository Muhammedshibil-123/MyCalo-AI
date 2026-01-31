import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import corporateIllustration from "../../assets/images/corporate_illustration.webp";
import api from "../../lib/axios";
import { FaEye, FaEyeSlash, FaCopy, FaCheck } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";

const CorporateRegister = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isRegistered, setIsRegistered] = useState(false);
    const [authData, setAuthData] = useState(null);
    const [copied, setCopied] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/api/users/corporate-register/", {
                username,
                email,
                employee_id: employeeId,
                password,
                confirm_password: confirmPassword,
            });

            if (response.status === 200 || response.status === 201) {
                setAuthData({
                    email,
                    secret: response.data.secret,
                    otpauth_url: response.data.otpauth_url,
                });
                setIsRegistered(true);
            }
        } catch (err) {
            const first = err.response?.data
                ? Object.values(err.response.data)[0]
                : "Something went wrong";
            setError(Array.isArray(first) ? first[0] : first);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(authData.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-white relative">

            {!isRegistered && (
                <div className="md:hidden h-[30vh] w-full">
                    <img
                        src={corporateIllustration}
                        alt="Corporate Register"
                        className="h-full w-full object-cover"
                    />
                </div>
            )}

            <div
                className={`md:hidden px-6 ${isRegistered
                    ? "min-h-screen flex items-center justify-center"
                    : "py-6"
                    }`}
            >
                {isRegistered ? (
                    <QRContent
                        authData={authData}
                        copied={copied}
                        handleCopy={handleCopy}
                        handleContinue={() => navigate("/login")}
                    />
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Corporate Register
                        </h2>
                        <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                            If you already have a corporate account, you can re-register using the same
                            credentials to regenerate your authenticator setup.
                        </p>

                        <RegisterForm
                            handleSubmit={handleSubmit}
                            username={username}
                            setUsername={setUsername}
                            email={email}
                            setEmail={setEmail}
                            employeeId={employeeId}
                            setEmployeeId={setEmployeeId}
                            password={password}
                            setPassword={setPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            showConfirmPassword={showConfirmPassword}
                            setShowConfirmPassword={setShowConfirmPassword}
                            error={error}
                            loading={loading}
                        />

                        <p className="text-center text-sm text-gray-600 mt-6">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#6C3AC9] font-semibold">
                                Login
                            </Link>
                        </p>
                    </>
                )}
            </div>

            <div className="hidden md:flex items-center justify-center h-screen relative">
                {!isRegistered && (
                    <>
                        <img
                            src={corporateIllustration}
                            className="absolute inset-0 w-full h-full object-cover blur-[2px]"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                    </>
                )}

                <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10">
                    {isRegistered ? (
                        <QRContent
                            authData={authData}
                            copied={copied}
                            handleCopy={handleCopy}
                            handleContinue={() => navigate("/login")}
                        />
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                Corporate Register
                            </h2>
                            <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                                If you already have a corporate account, you can re-register using the same
                                credentials to regenerate your authenticator setup.
                            </p>

                            <RegisterForm
                                handleSubmit={handleSubmit}
                                username={username}
                                setUsername={setUsername}
                                email={email}
                                setEmail={setEmail}
                                employeeId={employeeId}
                                setEmployeeId={setEmployeeId}
                                password={password}
                                setPassword={setPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                                error={error}
                                loading={loading}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const RegisterForm = ({
    handleSubmit,
    username,
    setUsername,
    email,
    setEmail,
    employeeId,
    setEmployeeId,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    loading,
}) => (
    <form onSubmit={handleSubmit} className="space-y-4">
        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border"
            required
        />
        <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border"
            required
        />
        <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border"
            required
        />

        <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border"
                required
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
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
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border"
                required
            />
            <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
            >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-[#6C3AC9]"
        >
            {loading ? "Registering..." : "Register"}
        </button>
    </form>
);

const QRContent = ({ authData, copied, handleCopy, handleContinue }) => (
    <div className="w-full max-w-sm flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold mb-3">Setup Authenticator</h2>

        <QRCodeCanvas
            value={authData?.otpauth_url || ""}
            size={240}
            includeMargin
        />
        <div className="mt-5 text-center max-w-sm">
            <p className="text-sm font-medium text-gray-800">
                Set up your authenticator app
            </p>

            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Download an authenticator app on your phone, open it and scan the QR code above.
                <br />
                If scanning is not possible, you can manually enter the secret key shown below.
            </p>
        </div>

        <div className="w-full mt-6 bg-gray-50 rounded-lg p-3 border">
            <div className="flex justify-between items-center">
                <span className="font-mono text-sm truncate">{authData?.secret}</span>
                <button onClick={handleCopy}>
                    {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
            </div>
        </div>

        <button
            onClick={handleContinue}
            className="mt-6 w-full py-3 bg-[#6C3AC9] text-white rounded-xl font-semibold"
        >
            Go to Login
        </button>
    </div>
);

export default CorporateRegister;
