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
                confirm_password: confirmPassword
            });

            if (response.status === 201 || response.status === 200) {
                setAuthData({
                    email: email,
                    secret: response.data.secret,
                    otpauth_url: response.data.otpauth_url
                });
                setIsRegistered(true);
            }
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                let errorMessage = "Registration failed";

                if (typeof data === "string") {
                    errorMessage = data;
                } else if (typeof data === "object") {
                    const firstValue = Object.values(data)[0];
                    if (Array.isArray(firstValue)) {
                        errorMessage = firstValue[0];
                    } else {
                        errorMessage = firstValue;
                    }
                }
                setError(errorMessage);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (authData?.secret) {
            navigator.clipboard.writeText(authData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleContinue = () => {
        navigate("/login");
    };

    return (
        <div className="h-screen w-full overflow-y-auto md:overflow-hidden no-scrollbar bg-white relative">
            
            <div className="md:hidden h-[30vh] w-full">
                {!isRegistered && (
                    <img
                        src={corporateIllustration}
                        alt="Corporate Register"
                        className="h-full w-full object-cover"
                    />
                )}
            </div>

            <div className={`md:hidden ${isRegistered ? 'h-auto py-8' : 'h-[60vh] py-6'} px-6`}>
                {isRegistered ? (
                    <QRContent
                        authData={authData}
                        copied={copied}
                        handleCopy={handleCopy}
                        handleContinue={handleContinue}
                    />
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Corporate Register
                        </h2>
                        <RegisterForm
                            handleSubmit={handleSubmit}
                            username={username} setUsername={setUsername}
                            email={email} setEmail={setEmail}
                            employeeId={employeeId} setEmployeeId={setEmployeeId}
                            password={password} setPassword={setPassword}
                            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                            showPassword={showPassword} setShowPassword={setShowPassword}
                            showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                            error={error} loading={loading}
                        />
                        <p className="text-center text-sm text-gray-600 mt-6">
                            Already have an account? <Link to="/login" className="text-[#6C3AC9] font-semibold">Login</Link>
                        </p>
                    </>
                )}
            </div>

            {}
            <div className="hidden md:fixed md:inset-0 md:block relative">
                {!isRegistered && (
                    <>
                        <img
                            src={corporateIllustration}
                            alt="Register"
                            className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                    </>
                )}

                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10 transition-all duration-300">
                        
                        {isRegistered ? (
                            <QRContent
                                authData={authData}
                                copied={copied}
                                handleCopy={handleCopy}
                                handleContinue={handleContinue}
                            />
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                    Corporate Register
                                </h2>
                                <RegisterForm
                                    handleSubmit={handleSubmit}
                                    username={username} setUsername={setUsername}
                                    email={email} setEmail={setEmail}
                                    employeeId={employeeId} setEmployeeId={setEmployeeId}
                                    password={password} setPassword={setPassword}
                                    confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                                    showPassword={showPassword} setShowPassword={setShowPassword}
                                    showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                                    error={error} loading={loading}
                                />
                                <p className="text-center text-sm text-gray-600 mt-6">
                                    Already have an account? <Link to="/login" className="text-[#6C3AC9] font-semibold">Login</Link>
                                </p>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

const RegisterForm = ({ 
    handleSubmit,
    username, setUsername,
    email, setEmail,
    employeeId, setEmployeeId,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    error, loading
}) => (
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

        {}
        <input
            type="text"
            placeholder="Employee ID (e.g., doc1234, employee1234)"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
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
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
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
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <p className="text-xs text-gray-500 leading-relaxed">
            After creating an account, you will need to set up Google Authenticator.
        </p>

        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold shadow-lg disabled:opacity-50"
            style={{ backgroundColor: "#6C3AC9" }}
        >
            {loading ? "Registering..." : "Register"}
        </button>
    </form>
);

const QRContent = ({ authData, copied, handleCopy, handleContinue }) => (
    <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Setup Authenticator
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
            1. Download <b>Google Authenticator</b><br />
            2. Scan the QR code or enter the key manually.
        </p>

        <div className="bg-white p-3 rounded-lg shadow-inner border border-gray-200 mb-6">
            <QRCodeCanvas
                value={authData?.otpauth_url || ""}
                size={180}
                level={"H"}
                includeMargin={true}
            />
        </div>

        <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1 text-center font-medium">MANUAL ENTRY KEY</p>
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2">
                <span className="font-mono text-[#6C3AC9] font-bold tracking-wider text-sm truncate mr-2">
                    {authData?.secret}
                </span>
                <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-[#6C3AC9] transition-colors"
                    title="Copy to clipboard"
                >
                    {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
            </div>
            {copied && <p className="text-xs text-green-600 text-center mt-1">Copied to clipboard!</p>}
        </div>

        <button
            onClick={handleContinue}
            className="w-full py-3 rounded-xl text-white font-semibold shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: "#6C3AC9" }}
        >
            I Have Scanned It, Go to Login
        </button>
    </div>
);

export default CorporateRegister;
