import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { GoHomeFill, GoHome } from "react-icons/go";
import { TbDashboardFilled, TbDashboard, TbMedicalCross } from "react-icons/tb";
import { FaRegUser, FaUser, FaRobot } from "react-icons/fa"; // Imported FaRobot
import { IoMedical } from "react-icons/io5";

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const activeColor = "#793cdd";
  const inactiveColor = "#bfc3d7";

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />

      {/* --- FLOATING AI CHAT BUTTON --- */}
      <div className="fixed right-6 bottom-40 z-50">
        <button
          onClick={() => navigate("/ai-chat")}
          className="bg-gradient-to-tr from-[#793cdd] to-[#9b63f8] text-white p-4 rounded-full shadow-lg shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open AI Chat"
        >
          <FaRobot className="text-[26px] group-hover:animate-pulse" />
        </button>
      </div>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div className="fixed left-0 right-0 bottom-9 px-4 z-50">
        <div className="mx-auto max-w-lg">
          <div className="bg-white/95 rounded-3xl shadow-lg py-4 px-6 flex items-center justify-between backdrop-blur-sm">
            
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-1 px-3 text-sm"
              style={{ color: isActive("/") ? activeColor : inactiveColor }}
            >
              {isActive("/") ? (
                <GoHomeFill className="text-[30px]" />
              ) : (
                <GoHome className="text-[30px]" />
              )}
              <span className="mt-1 text-xs">Home</span>
            </button>

            <button
              onClick={() => navigate("/analytics")}
              className="flex flex-col items-center gap-1 px-3 text-sm"
              style={{ color: isActive("/analytics") ? activeColor : inactiveColor }}
            >
              {isActive("/analytics") ? (
                <TbDashboardFilled className="text-[30px]" />
              ) : (
                <TbDashboard className="text-[30px]" />
              )}
              <span className="mt-1 text-xs">Analytics</span>
            </button>

            <button
              onClick={() => navigate("/consult")}
              className="flex flex-col items-center gap-1 px-3 text-sm"
              style={{ color: isActive("/consult") ? activeColor : inactiveColor }}
            >
              {isActive("/consult") ? (
                <IoMedical className="text-[30px]" />
              ) : (
                <TbMedicalCross className="text-[30px]" />
              )}
              <span className="mt-1 text-xs">Consult</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center gap-1 px-3 text-sm"
              style={{ color: isActive("/profile") ? activeColor : inactiveColor }}
            >
              {isActive("/profile") ? (
                <FaUser className="text-[30px]" />
              ) : (
                <FaRegUser className="text-[30px]" />
              )}
              <span className="mt-1 text-xs">Profile</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;