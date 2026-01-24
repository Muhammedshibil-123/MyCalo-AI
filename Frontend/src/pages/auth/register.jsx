import React, { useState } from 'react';
import api from '../../lib/axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        mobile: '',
        password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/accounts/register/', formData);
            // Redirect to OTP verification after registration
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            setErrors(err.response?.data || { message: "Registration failed" });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                
                {Object.keys(errors).map(key => (
                    <p key={key} className="text-red-500 text-xs">{errors[key]}</p>
                ))}

                <input type="text" placeholder="Username" className="w-full p-2 mb-3 border rounded"
                    onChange={(e) => setFormData({...formData, username: e.target.value})} />
                
                <input type="email" placeholder="Email" className="w-full p-2 mb-3 border rounded"
                    onChange={(e) => setFormData({...formData, email: e.target.value})} />

                <input type="text" placeholder="Mobile" className="w-full p-2 mb-3 border rounded"
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})} />

                <input type="password" placeholder="Password" className="w-full p-2 mb-3 border rounded"
                    onChange={(e) => setFormData({...formData, password: e.target.value})} />

                <input type="password" placeholder="Confirm Password" className="w-full p-2 mb-6 border rounded"
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} />

                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    Register
                </button>
                <p className="mt-4 text-center">
                    Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;