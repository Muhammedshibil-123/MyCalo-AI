// src/lib/axios.js
import axios from 'axios';

let access_token_in_memory = null; // Our private storage

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // Django server
    withCredentials: true,           // Send HttpOnly cookies automatically
});

export const setAccessToken = (token) => {
    access_token_in_memory = token;
};

// --- REQUEST INTERCEPTOR: The Sticker Machine ---
api.interceptors.request.use((config) => {
    if (access_token_in_memory) {
        config.headers.Authorization = `Bearer ${access_token_in_memory}`;
    }
    return config;
});

// --- RESPONSE INTERCEPTOR: The Recovery Team ---
api.interceptors.response.use(
    (response) => response, // If the request worked, just return the data
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 (Expired) and we haven't tried refreshing yet
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // 1. Call the Refresh endpoint
                // Browser sends 'refresh_token' cookie automatically
                const rs = await api.post('/api/accounts/token/refresh/');
                
                // 2. Get the new fresh access token
                const new_access = rs.data.access;

                // 3. Save it back to memory
                setAccessToken(new_access);

                // 4. Retry the original request with the new token
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh also fails, the session is dead (User must login again)
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;