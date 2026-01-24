import React, { useState } from 'react';
import api, { setAccessToken } from "../../lib/axios";
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/users/login/', formData);
            
            setAccessToken(response.data.access);
            
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('role', response.data.role);

            navigate('/'); 
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Login to ZenCal AI</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <input
                    type="text"
                    placeholder="Username or Email"
                    className="w-full p-2 mb-4 border rounded"
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 mb-6 border rounded"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Login
                </button>
                <p className="mt-4 text-center">
                    Don't have an account? <Link to="/register" className="text-blue-500">Register</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;