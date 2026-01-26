import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import api, { setAccessToken } from './lib/axios';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import VerfiyOtp from './pages/auth/VerfiyOtp';
import Profile from './pages/user/profile';
import Home from './pages/user/home';
import Dashboard from './pages/user/dashboard';
import UserNavbar from './layout/UserNavbar';

const ProtectedRoute = ({ isAuth }) => {
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ isAuth }) => {
  return isAuth ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.post('/api/users/token/refresh/');
                setAccessToken(response.data.access);
                setIsAuth(true);
            } catch (err) {
                setIsAuth(false);
                setAccessToken(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route element={<PublicRoute isAuth={isAuth} />}>
                    <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/otp-verfiy" element={<VerfiyOtp setIsAuth={setIsAuth} />} />
                </Route>

                <Route element={<ProtectedRoute isAuth={isAuth} />}>
                    <Route element={<UserNavbar />}>
                        <Route path="/" element={<Home/>} />
                        <Route path="/profile" element={<Profile setIsAuth={setIsAuth} />} />
                        <Route path="/analytics" element={<Dashboard/>} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to={isAuth ? "/" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;