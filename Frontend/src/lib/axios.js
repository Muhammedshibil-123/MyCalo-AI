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

api.interceptors.request.use((config) => {
  store.dispatch(startFetching()); // Increment counter
  if (access_token_in_memory) {
    config.headers.Authorization = `Bearer ${access_token_in_memory}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    store.dispatch(stopFetching()); // Decrement counter
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle case where error happens on login or if refresh fails
    if (originalRequest.url.includes("/login/") || originalRequest._retry) {
        store.dispatch(stopFetching());
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rs = await api.post("/api/users/token/refresh/");
        const new_access = rs.data.access;
        setAccessToken(new_access);
        originalRequest.headers.Authorization = `Bearer ${new_access}`;
        
        // Decrement the failed request's count before retrying
        store.dispatch(stopFetching()); 
        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(stopFetching());
        return Promise.reject(refreshError);
      }
    }

    store.dispatch(stopFetching()); // Ensure counter stops even on error
    return Promise.reject(error);
  },
);

export default api;