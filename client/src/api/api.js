import axios from "axios";

export const AUTH_LOGOUT_EVENT = "auth:logout";

const BASE_URL = import.meta.env.VITE_API_ENDPOINT;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    const isAuthEndpoint =
      requestUrl.includes("/login") ||
      requestUrl.includes("/signup") ||
      requestUrl.includes("/refresh");

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient.post("/refresh", {});
      }

      const refreshResponse = await refreshPromise;
      const nextAccessToken = refreshResponse?.data?.access_token;

      if (!nextAccessToken) {
        throw new Error("No access token returned from refresh endpoint.");
      }

      localStorage.setItem("token", nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default api;