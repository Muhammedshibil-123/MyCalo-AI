import axios from "axios";
import { store } from "../redux/store";
import { startFetching, stopFetching } from "../redux/authslice";

let access_token_in_memory = null;

const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

export const setAccessToken = (token) => {
  access_token_in_memory = token;
};

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use((config) => {
  // FIX: Only show global loader if 'skipLoading' is NOT true
  if (!config.skipLoading) {
    store.dispatch(startFetching());
  }
  
  if (access_token_in_memory) {
    config.headers.Authorization = `Bearer ${access_token_in_memory}`;
  }
  return config;
});

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    // FIX: Only stop global loader if we started it
    if (!response.config.skipLoading) {
      store.dispatch(stopFetching());
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle login/retry cases
    if (originalRequest.url.includes("/login/") || originalRequest._retry) {
        if (!originalRequest.skipLoading) store.dispatch(stopFetching());
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rs = await api.post("/api/users/token/refresh/", {}, { skipLoading: true }); // Skip loader for refresh too
        const new_access = rs.data.access;
        setAccessToken(new_access);
        originalRequest.headers.Authorization = `Bearer ${new_access}`;
        
        // Decrement ONLY if we incremented initially
        if (!originalRequest.skipLoading) store.dispatch(stopFetching());
        
        return api(originalRequest);
      } catch (refreshError) {
        if (!originalRequest.skipLoading) store.dispatch(stopFetching());
        return Promise.reject(refreshError);
      }
    }

    // Standard error cleanup
    if (!originalRequest.skipLoading) {
        store.dispatch(stopFetching());
    }
    return Promise.reject(error);
  },
);

export default api;