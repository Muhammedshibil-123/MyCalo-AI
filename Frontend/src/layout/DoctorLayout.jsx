import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authslice';
import { 
  FiHome,
  FiUser,
  FiMessageSquare, 
  FiDatabase, 
  FiActivity, 
  FiArrowLeft, 
  FiPieChart, 
  FiClipboard, 
  FiCpu,
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';

export default function DoctorLayout() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const isChatContext = !!roomId;

  // Base navigation items similar to AdminLayout
  const mainNavItems = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: FiHome },
    { name: 'Profile', path: '/doctor/profile', icon: FiUser },
    { name: 'Consultations', path: '/doctor/consult', icon: FiMessageSquare },
    { name: 'Food Items', path: '/doctor/foods', icon: FiDatabase },
    { name: 'Exercise Plans', path: '/doctor/exercise', icon: FiActivity },
  ];

  // Specific tools for when a doctor is inside a patient consultation
  const chatNavItems = [
    { name: 'Back to List', path: '/doctor/consult', icon: FiArrowLeft, isBack: true },
    { name: 'Live Chat', path: `/doctor/chat/${roomId}`, icon: FiMessageSquare },
    { name: 'AI Assistant', path: `/doctor/ai-assistant/${roomId}`, icon: FiCpu },
    { name: 'History', path: `/doctor/history/${roomId}`, icon: FiPieChart },
    { name: 'Patient Logs', path: `/doctor/logs/${roomId}`, icon: FiClipboard },
  ];

  const handleLogout = () => {
    dispatch(logout()); //
    navigate('/login');
  };

  const navItems = isChatContext ? chatNavItems : mainNavItems;

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {/* Mobile Overlay - Consistent with AdminSidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Zinc Aesthetic */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xs">M</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white uppercase">
              Doctor <span className="text-zinc-500">Workspace</span>
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation - Styled using NavLink for active states */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {isChatContext && (
            <div className="px-3 mb-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Consultation Tools
              </p>
            </div>
          )}
          
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    isActive && !item.isBack
                      ? 'bg-zinc-900 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User / Logout Section */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-black border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <FiMenu size={20} />
          </button>
          <span className="text-sm font-semibold text-white">MyCalo AI</span>
          <div className="w-8" /> 
        </header>

        {/* Page Content - Dark Background */}
        <main className="flex-1 overflow-y-auto bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
}