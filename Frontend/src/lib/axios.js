import axios from "axios";

let access_token_in_memory = null;

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

export const setAccessToken = (token) => {
  access_token_in_memory = token;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    
    if (originalRequest.url.includes("/login/")) {
        return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rs = await api.post("/api/users/token/refresh/");
        const new_access = rs.data.access;
        setAccessToken(new_access);
        
        originalRequest.headers.Authorization = `Bearer ${new_access}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;