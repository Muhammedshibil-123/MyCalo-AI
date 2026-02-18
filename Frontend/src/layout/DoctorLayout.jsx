import React, { useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // 1. Import useDispatch
import { 
  IoMdChatbubbles, IoMdRestaurant, IoMdFitness, IoMdLogOut, 
  IoMdArrowBack, IoMdAnalytics, IoMdListBox, IoMdMenu, IoMdClose 
} from 'react-icons/io';
import { RiRobot2Fill } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../redux/authslice'; // 2. Import logout action

const DoctorLayout = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch(); // 3. Initialize dispatch
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isChatContext = !!roomId;

  const mainNavItems = [
    { name: 'Chats', icon: <IoMdChatbubbles />, path: '/doctor/consult' },
    { name: 'Foods', icon: <IoMdRestaurant />, path: '/doctor/foods' },
    { name: 'Exercise', icon: <IoMdFitness />, path: '/doctor/exercise' },
  ];

  const chatNavItems = [
    { name: 'Chat', icon: <IoMdChatbubbles />, path: `/doctor/chat/${roomId}` },
    { name: 'AI Assistant', icon: <RiRobot2Fill />, path: `/doctor/ai-assistant/${roomId}` },
    { name: 'History', icon: <IoMdAnalytics />, path: `/doctor/history/${roomId}` },
    { name: 'Logs', icon: <IoMdListBox />, path: `/doctor/logs/${roomId}` },
  ];

  // 4. Update handleLogout to use Redux
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200 shadow-xl z-30">
        <div className="p-6">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight italic">MyCalo <span className="text-gray-900">AI</span></h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {isChatContext ? (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <button 
                onClick={() => navigate('/doctor/consult')}
                className="flex items-center gap-3 w-full p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mb-4 font-bold"
              >
                <IoMdArrowBack size={20} /> Back to List
              </button>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold px-3 mb-2">Consultation Tools</p>
              {chatNavItems.map((item) => (
                <Link key={item.name} to={item.path} className={`flex items-center gap-4 p-3.5 rounded-xl font-bold transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="text-xl">{item.icon}</span> {item.name}
                </Link>
              ))}
            </motion.div>
          ) : (
            mainNavItems.map((item) => (
              <Link key={item.name} to={item.path} className={`flex items-center gap-4 p-3.5 rounded-xl font-bold transition-all ${location.pathname.startsWith(item.path) ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className="text-xl">{item.icon}</span> {item.name}
              </Link>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all">
            <IoMdLogOut size={22} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* --- MOBILE HEADER (HIDDEN IN CHAT) --- */}
        {!isChatContext && (
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40">
             <h1 className="text-xl font-black text-blue-600 italic">MyCalo AI</h1>
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-700 bg-gray-100 rounded-lg">
               <IoMdMenu size={24} />
             </button>
          </header>
        )}

        <div className={`flex-1 overflow-y-auto ${isChatContext ? 'pb-20' : ''} lg:pb-0`}>
          <Outlet />
        </div>

        {/* --- MOBILE BOTTOM NAVBAR (SHOWN ONLY IN CHAT) --- */}
        <AnimatePresence>
          {isChatContext && (
            <motion.div 
              initial={{ y: 100 }} 
              animate={{ y: 0 }} 
              exit={{ y: 100 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50"
            >
              {chatNavItems.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[70px] ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  <span className={`text-2xl transition-transform ${location.pathname === item.path ? 'scale-110' : ''}`}>{item.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- MOBILE SIDE DRAWER (HAMBURGER) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-[60] lg:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[70] shadow-2xl lg:hidden flex flex-col">
              <div className="p-6 flex items-center justify-between border-b">
                <span className="font-black text-blue-600 italic">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><IoMdClose size={20}/></button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {mainNavItems.map((item) => (
                  <Link key={item.name} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${location.pathname.startsWith(item.path) ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                    <span className="text-xl">{item.icon}</span> {item.name}
                  </Link>
                ))}
              </nav>
              {/* 5. ADDED LOGOUT BUTTON FOR MOBILE HERE */}
              <div className="p-4 border-t border-gray-100">
                <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl font-bold transition-all">
                  <IoMdLogOut size={22} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorLayout;