import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { GoHomeFill, GoHome } from "react-icons/go";
import { TbDashboardFilled, TbDashboard, TbMedicalCross } from "react-icons/tb";
import { FaRegUser,FaUser  } from "react-icons/fa";

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

      <div className="fixed left-0 right-0 bottom-6 px-4 z-50">
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
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center gap-1 px-3 text-sm"
              style={{ color: isActive("/consult") ? activeColor : inactiveColor }}
            >
              {isActive("/chat") ? (
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
