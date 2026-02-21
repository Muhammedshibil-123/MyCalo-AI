import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api, { setAccessToken } from './lib/axios';
import { setCredentials, logout, finishInitialLoad } from './redux/authslice';
import { requestForToken } from './firebase';

import AccountBlockedModal from './components/AccountBlockedModal';
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
import FoodDetail from './pages/user/FoodDetail';
import CreateWithAI from './pages/user/CreateWithAI';
import AnalyzeImageResult from './pages/user/AnalyzeImageResult';
import ManualEntry from './pages/user/ManualEntry';
import Chat from './pages/user/Chat';
import Consult from './pages/user/Consult';
import DoctorLayout from './layout/DoctorLayout';
import DoctorConsultList from './pages/doctor/DoctorConsultList';
import DoctorChatPage from './pages/doctor/DoctorChatPage';
import { UploadProvider } from './context/UploadContext';
import Questionnaire from "./pages/user/Questionnaire";
import DoctorFoods from './pages/doctor/DoctorFoods';
import ProfileEdit from './pages/user/profileEdit';
import ChatAI from './pages/user/ChatAI';
import AdminLayout from './layout/AdminSidebar';
import AdminFoods from './pages/admin/AdminFoods';
import AdminExercises from './pages/admin/AdminExercises';
import DoctorExercises from './pages/doctor/DoctorExercises';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import PatientAIChat  from './pages/doctor/PatientAIChat';
import PatientHistory  from './pages/doctor/PatientHistory';

const getHomeRouteForRole = (role) => {
    if (role === 'admin' || role === 'employee') return '/admin/dashboard';
    if (role === 'doctor') return '/doctor/consult';
    if (role === 'user') {
        if (!goal || goal === 0) return '/questionnaire';
        return '/';
    }
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
    const { loading, loadingCount, isAuthenticated, user } = useSelector((state) => state.auth);

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

    useEffect(() => {
        const setupNotifications = async () => {
            if (isAuthenticated) {
                try {
                    const permission = await Notification.requestPermission();

                    if (permission === 'granted') {
                        const token = await requestForToken();

                        if (token) {
                            await api.patch('/api/profiles/update/', {
                                fcm_token: token
                            });
                            console.log("FCM Token successfully sent to Django!");
                        }
                    } else {
                        console.log(" User denied notification permission.");
                    }
                } catch (error) {
                    console.error(" Failed to setup notifications:", error);
                }
            }
        };

        setupNotifications();
    }, [isAuthenticated]);

    if (loading) return <LoadingScreen />;

    return (
        <UploadProvider>
            <Router>
                <AccountBlockedModal />
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
                            <Route path="/consult" element={<Consult />} />
                        </Route>
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/food/:id" element={<FoodDetail />} />
                        <Route path="/create-ai" element={<CreateWithAI />} />
                        <Route path="/analyze-image-result" element={<AnalyzeImageResult />} />
                        <Route path="/manual-entry" element={<ManualEntry />} />\
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/questionnaire" element={<Questionnaire />} />
                        <Route path="/profile/edit" element={<ProfileEdit />} />
                        <Route path="/ai-chat" element={<ChatAI />} />
                    </Route>

                    <Route element={<RoleRoute allowedRoles={['admin', 'employee']} />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/foods" element={<AdminFoods/>} />
                            <Route path="/admin/exercises" element={<AdminExercises/>} />
                            <Route element={<RoleRoute allowedRoles={['admin']} />}>
                                <Route path="/admin/usermanagement" element={<AdminUserManagement/>} />
                            </Route>
                        </Route>
                    </Route>

                    <Route element={<RoleRoute allowedRoles={['doctor']} />}>
                        <Route element={<DoctorLayout />}>
                            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                            <Route path="/doctor/consult" element={<DoctorConsultList />} />
                            <Route path="/doctor/chat/:roomId" element={<DoctorChatPage />} />
                            <Route path="/doctor/foods" element={<DoctorFoods />} />
                            <Route path="/doctor/exercises" element={<DoctorExercises />} />
                            <Route path="/doctor/ai-chat/:roomId" element={<PatientAIChat />} />
                            <Route path="/doctor/history/:roomId" element={<PatientHistory />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </UploadProvider>
    );
}

export default App;