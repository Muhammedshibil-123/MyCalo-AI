import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRegUser,
  FaBell,
  FaFileAlt,
  FaHeadset,
  FaSignOutAlt
} from "react-icons/fa";
import { IoChevronForward } from "react-icons/io5";

const Profile = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-semibold">
            M
          </div>
          <div className="flex-1">
            <h2 className="text-[22px] font-semibold text-gray-900 leading-tight">
              Muhammed Shibil
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              8606569408 | sanuvkd104@gmail.com
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <div className="mt-3 bg-white divide-y">
        <button
          onClick={() => navigate("/profile/edit")}
          className="w-full flex items-center px-5 py-4"
        >
          <FaRegUser className="text-xl text-gray-700 mr-4" />
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium text-gray-900">Profile</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              View or edit your profile information
            </p>
          </div>
          <IoChevronForward className="text-gray-400 text-xl" />
        </button>

        <div className="w-full flex items-center px-5 py-4">
          <FaBell className="text-xl text-gray-700 mr-4" />
          <div className="flex-1">
            <p className="text-[16px] font-medium text-gray-900">
              Notifications
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Health reminders and alerts
            </p>
          </div>

          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 rounded-full relative transition ${
              notifications ? "bg-purple-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
                notifications ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <button
          onClick={() => navigate("/terms")}
          className="w-full flex items-center px-5 py-4"
        >
          <FaFileAlt className="text-xl text-gray-700 mr-4" />
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium text-gray-900">
              Terms & Conditions
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              App usage rules & privacy policy
            </p>
          </div>
          <IoChevronForward className="text-gray-400 text-xl" />
        </button>
      </div>

      {/* Divider spacing exactly like image */}
      <div className="h-3" />

      {/* Section 2 */}
      <div className="bg-white divide-y">
        <button
          onClick={() => navigate("/support")}
          className="w-full flex items-center px-5 py-4"
        >
          <FaHeadset className="text-xl text-gray-700 mr-4" />
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium text-gray-900">
              Help & Support
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Get assistance or report issues
            </p>
          </div>
          <IoChevronForward className="text-gray-400 text-xl" />
        </button>

        <button
          onClick={() => navigate("/terms")}
          className="w-full flex items-center px-5 py-4"
        >
          <FaFileAlt className="text-xl text-gray-700 mr-4" />
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium text-gray-900">
              App Policies
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Legal, cookies and data usage
            </p>
          </div>
          <IoChevronForward className="text-gray-400 text-xl" />
        </button>

        <button
          onClick={() => navigate("/logout")}
          className="w-full flex items-center px-5 py-4"
        >
          <FaSignOutAlt className="text-xl text-gray-700 mr-4" />
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium text-gray-900">Logout</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Sign out from your account
            </p>
          </div>
          <IoChevronForward className="text-gray-400 text-xl" />
        </button>
      </div>
    </div>
  );
};

export default Profile;
