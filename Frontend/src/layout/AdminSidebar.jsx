import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiHome, 
  FiUser, 
  FiDatabase, 
  FiActivity, 
  FiUsers, 
  FiRadio, 
  FiMessageSquare, 
  FiAlertTriangle,
  FiX 
} from 'react-icons/fi';

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome, adminOnly: false },
    { name: 'Profile', path: '/admin/profile', icon: FiUser, adminOnly: false },
    { name: 'Food Items', path: '/admin/foods', icon: FiDatabase, adminOnly: false },
    { name: 'Exercises', path: '/admin/exercises', icon: FiActivity, adminOnly: false },
    { name: 'User Management', path: '/admin/users', icon: FiUsers, adminOnly: true },
    { name: 'Broadcast', path: '/admin/broadcast', icon: FiRadio, adminOnly: true },
    { name: 'Chat Monitor', path: '/admin/chats', icon: FiMessageSquare, adminOnly: false },
    { name: 'Flagged Content', path: '/admin/flagged', icon: FiAlertTriangle, adminOnly: false },
  ];

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container - Slimmed down to w-60 (240px) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
             {/* You can replace this with your logo */}
            <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
                <span className="text-white dark:text-black font-bold text-xs">M</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-black dark:text-white">
              {isAdmin ? 'Admin Panel' : 'Workspace'}
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-gray-100 text-black dark:bg-zinc-900 dark:text-white' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={16} className={({ isActive }) => isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}