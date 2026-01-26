import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api, { setAccessToken } from './lib/axios';
import { setCredentials, logout, finishInitialLoad } from './redux/authslice';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import VerfiyOtp from './pages/auth/VerfiyOtp';
import CorporateRegister from './pages/auth/CorporateRegister';
import Profile from './pages/user/profile';
import Home from './pages/user/home';
import Dashboard from './pages/user/dashboard';
import UserNavbar from './layout/UserNavbar';
import CorporateVerifyOtp from './pages/auth/CorporateVerifyOtp';


const ProtectedRoute = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.post('/api/users/token/refresh/');
                setAccessToken(response.data.access);
                dispatch(setCredentials({
                    user: response.data.user || { username: 'User' },
                    accessToken: response.data.access
                }));
            } catch (err) {
                dispatch(logout());
            } finally {
                dispatch(finishInitialLoad());
            }
        };

        checkAuth();
    }, [dispatch])

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/otp-verfiy" element={<VerfiyOtp />} />
                    <Route path="/corporate/register" element={<CorporateRegister />} />
                    <Route path="/corporate/verify-otp" element={<CorporateVerifyOtp />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route element={<UserNavbar />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/analytics" element={<Dashboard />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;