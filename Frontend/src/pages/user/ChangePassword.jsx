import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaChevronLeft } from "react-icons/fa";
import api from "../../lib/axios";

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.new_password !== formData.confirm_password) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {

      await api.post("/api/users/change-password/", {
        old_password: formData.old_password,
        new_password: formData.new_password,
      });
      alert("Password updated successfully!");
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password. Check your old password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-5">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-6">
        <FaChevronLeft className="mr-2" /> Back
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
            <input
              type="password"
              name="old_password"
              required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-600 outline-none"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="new_password"
              required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-600 outline-none"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-600 outline-none"
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold mt-4 hover:bg-purple-700 transition"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;