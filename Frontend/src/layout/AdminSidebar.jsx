import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authslice';
import { 
  FiHome, 
  FiUser, 
  FiDatabase, 
  FiActivity, 
  FiUsers, 
  FiRadio, 
  FiMessageSquare, 
  FiAlertTriangle,
  FiX,
  FiLogOut,
  FiMenu
} from 'react-icons/fi';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome, adminOnly: false },
    { name: 'Profile', path: '/admin/profile', icon: FiUser, adminOnly: false },
    { name: 'Food Items', path: '/admin/foods', icon: FiDatabase, adminOnly: false },
    { name: 'Exercises', path: '/admin/exercises', icon: FiActivity, adminOnly: false },
    { name: 'User Management', path: '/admin/usermanagement', icon: FiUsers, adminOnly: true },
    { name: 'Broadcast', path: '/admin/broadcast', icon: FiRadio, adminOnly: true },
    { name: 'Chat Monitor', path: '/admin/chats', icon: FiMessageSquare, adminOnly: false },
    { name: 'Flagged Content', path: '/admin/flagged', icon: FiAlertTriangle, adminOnly: false },
  ];

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Full Height */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-black border-r border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xs">M</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              {isAdmin ? 'Admin Panel' : 'Workspace'}
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive 
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? "text-white" : "text-zinc-500"} />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <FiLogOut size={18} className="text-zinc-500" />
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
          <span className="text-sm font-semibold text-white">
            {isAdmin ? 'Admin Panel' : 'Workspace'}
          </span>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
}