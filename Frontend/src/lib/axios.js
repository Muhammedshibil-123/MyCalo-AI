
import axios from 'axios';

let inMemoryToken = null;

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    withCredentials: true,
});

export const setAccessToken = (token) => {
    inMemoryToken = token;
};

api.interceptors.request.use((config) => {
    if (inMemoryToken) {
        config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
});

export default api;