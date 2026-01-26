import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoMdHome } from "react-icons/io";
import { IoAnalyticsSharp } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa6";
import { SiHelpscout } from "react-icons/si";

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />

      <div className="fixed left-0 right-0 bottom-6 px-4 z-50">
        <div className="mx-auto max-w-lg">
          <div className="bg-white/95 rounded-3xl shadow-lg py-4 px-6 flex items-center justify-between backdrop-blur-sm">
            
            <button
              onClick={() => navigate("/")}
              className={`flex flex-col items-center gap-1 px-3 text-sm ${
                isActive("/") ? "text-[#6C3AC9]" : "text-gray-500"
              }`}
            >
              <IoMdHome className="text-2xl" />
              <span className="mt-1 text-xs">Home</span>
            </button>

            <button
              onClick={() => navigate("/analytics")}
              className={`flex flex-col items-center gap-1 px-3 text-sm ${
                isActive("/analytics") ? "text-[#6C3AC9]" : "text-gray-500"
              }`}
            >
              <IoAnalyticsSharp className="text-2xl" />
              <span className="mt-1 text-xs">Analytics</span>
            </button>

            <button
              onClick={() => navigate("/consult")}
              className={`flex flex-col items-center gap-1 px-3 text-sm ${
                isActive("/consult") ? "text-[#6C3AC9]" : "text-gray-500"
              }`}
            >
              <SiHelpscout className="text-2xl" />
              <span className="mt-1 text-xs">Consult</span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className={`flex flex-col items-center gap-1 px-3 text-sm ${
                isActive("/profile") ? "text-[#6C3AC9]" : "text-gray-500"
              }`}
            >
              <FaRegUser className="text-2xl" />
              <span className="mt-1 text-xs">Profile</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;