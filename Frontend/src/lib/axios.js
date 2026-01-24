import axios from "axios";

let access_token_in_memory = null;

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
});

export const setAccessToken = (token) => {
  access_token_in_memory = token;
};

api.interceptors.request.use((config) => {
  if (access_token_in_memory) {
    config.headers.Authorization = `Bearer ${access_token_in_memory}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rs = await api.post("/api/accounts/token/refresh/");

        const new_access = rs.data.access;

        setAccessToken(new_access);

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
