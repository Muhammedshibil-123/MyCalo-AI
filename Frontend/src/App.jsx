import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api, { setAccessToken } from './lib/axios';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import VerfiyOtp from './pages/auth/VerfiyOtp';
import Dashboard from './pages/user/dashboard';
import Home from './pages/user/home';


function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const refreshAuth = async () => {
            try {
                const response = await api.post('/api/users/token/refresh/');
                setAccessToken(response.data.access);
            } catch (err) {
                console.log("No valid session found.");
            } finally {
                setLoading(false);
            }
        };
        refreshAuth();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/otp-verfiy" element={<VerfiyOtp />} />
                <Route path="/" element={<Home/>} />
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;