import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api, { setAccessToken } from './lib/axios';
import Login from './pages/auth/login';
import Register from './pages/auth/register';

function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const refreshAuth = async () => {
            try {
                const response = await api.post('/api/accounts/token/refresh/');
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
                <Route path="/" element={<h1 className="text-center mt-10 text-3xl">NutriLens Dashboard</h1>} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;