import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api, { setAccessToken } from './lib/axios';
import { setCredentials, logout, finishInitialLoad } from './redux/authslice';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import VerfiyOtp from './pages/auth/VerfiyOtp';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import CorporateRegister from './pages/auth/CorporateRegister';
import Welcome from './pages/auth/welcome';
import Profile from './pages/user/profile';
import Home from './pages/user/home';
import Dashboard from './pages/user/dashboard';
import UserNavbar from './layout/UserNavbar';
import CorporateVerifyOtp from './pages/auth/CorporateVerifyOtp';
import ChangePassword from './pages/user/ChangePassword';
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NotFound from './pages/user/NotFound';
import SearchPage from './pages/user/SearchPage';

const getHomeRouteForRole = (role) => {
    if (role === 'admin' || role === 'employee') return '/admin/dashboard';
    if (role === 'doctor') return '/doctor/dashboard';
    return '/'; 
};

const DelayedLoader = ({ isLoading }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        let timeout;
        if (isLoading) {
            timeout = setTimeout(() => {
                setShow(true);
            }, 10);
        } else {
            setShow(false);
        }
        return () => clearTimeout(timeout);
    }, [isLoading]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <LoadingScreen />
        </div>
    );
};

const PublicRoute = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    if (isAuthenticated) {
        const dest = getHomeRouteForRole(user?.role);
        return <Navigate to={dest} replace />;
    }
    return <Outlet />;
};

const RoleRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    if (!isAuthenticated) return <Navigate to="/welcome" replace />;

    if (!allowedRoles.includes(user?.role)) {
        const correctHome = getHomeRouteForRole(user?.role);
        return <Navigate to={correctHome} replace />;
    }

    return <Outlet />;
};

function App() {
    const dispatch = useDispatch();
    const { loading, loadingCount } = useSelector((state) => state.auth);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.post('/api/users/token/refresh/');
                setAccessToken(response.data.access);
                dispatch(setCredentials({
                    user: response.data.user,
                    accessToken: response.data.access
                }));
            } catch (err) {
                dispatch(logout());
            } finally {
                dispatch(finishInitialLoad());
            }
        };

        checkAuth();
    }, [dispatch]);

    if (loading) return <LoadingScreen />;

    return (
        <Router>
            <DelayedLoader isLoading={loadingCount > 0} />
            <Routes>
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/otp-verfiy" element={<VerfiyOtp />} />
                    <Route path="/corporate/register" element={<CorporateRegister />} />
                    <Route path="/corporate/verify-otp" element={<CorporateVerifyOtp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/welcome" element={<Welcome />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['user', undefined, null]} />}>
                    <Route element={<UserNavbar />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/change-password" element={<ChangePassword />} />
                        <Route path="/analytics" element={<Dashboard />} />
                    </Route>
                    <Route path="/search" element={<SearchPage />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['admin', 'employee']} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['doctor']} />}>
                    <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;