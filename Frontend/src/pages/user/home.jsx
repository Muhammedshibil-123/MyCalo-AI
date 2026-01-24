import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={goToDashboard}
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Home;
