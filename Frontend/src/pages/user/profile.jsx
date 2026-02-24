import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authslice";
import {
  FaRegUser,
  FaBell,
  FaFileAlt,
  FaHeadset,
  FaSignOutAlt,
  FaLock
} from "react-icons/fa";
import { IoChevronForward } from "react-icons/io5";
import { setAccessToken } from "../../lib/axios";
import api from "../../lib/axios";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState(false);
  const [profile, setProfile] = useState(null);

  // Fetch Profile and Initial Notification Status
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/profiles/me/');
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();

    // Check actual browser permission on load
    if ("Notification" in window) {
      setNotifications(Notification.permission === "granted");
    }
  }, []);

  const handleNotificationToggle = async () => {
    // 1. Check if browser even supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    // 2. Handle the toggle logic based on current browser permission
    if (Notification.permission === "granted") {
      // Browser doesn't let us turn it OFF via code. User must do it in settings.
      alert("Notifications are already allowed! To turn them off, click the lock icon 🔒 next to the website URL and block notifications.");
    } else if (Notification.permission === "denied") {
      // User previously clicked "Block". We can't show the popup again.
      alert("You previously blocked notifications. To allow them, click the lock icon 🔒 next to the website URL and change the permission.");
    } else {
      // 3. THIS TRIGGERS THE BROWSER'S NATIVE ALLOW/BLOCK POPUP
      const permission = await Notification.requestPermission();
      
      // Update our toggle state based on what they clicked in the popup
      setNotifications(permission === "granted");
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      await api.post("/api/users/logout/");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setAccessToken(null);
      dispatch(logout());
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-24">
      <div className="bg-white px-5 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-semibold overflow-hidden">
            {profile?.photo ? (
              <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (profile?.name?.[0] || user?.username?.[0] || "U").toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-[22px] font-semibold text-gray-900 leading-tight capitalize">
              {profile?.name || user?.username || "User"}
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              @{user?.username || ""} {user?.email ? `| ${user.email}` : ""}
            </p>
          </div>
        </div>
      </div>

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
            onClick={handleNotificationToggle}
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
          onClick={() => navigate("/profile/change-password")}
          className="w-full flex items-center px-5 py-4"
        >
          <FaLock className="text-xl text-gray-700 mr-4" />
          <div className="flex-1 text-left">
            <p className="text-[16px] font-medium text-gray-900">Change Password</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Update your account security
            </p>
          </div>
          <IoChevronForward className="text-gray-400 text-xl" />
        </button>
      </div>

      <div className="h-3" />

      <div className="bg-white divide-y">
        <button
          onClick={() => navigate("/help-support")}
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
          onClick={() => navigate("/terms-conditions")}
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

        <button
          onClick={handleLogout}
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