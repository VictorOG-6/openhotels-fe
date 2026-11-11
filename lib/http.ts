// lib/axios.ts - Updated with auto-refresh interceptor
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./constants";

export const $http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Add access token to axios instance
 */
export const addAccessTokenToHttpInstance = (token: string) => {
  $http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

/**
 * Remove access token from axios instance
 */
export const removeAccessTokenFromHttpInstance = () => {
  delete $http.defaults.headers.common["Authorization"];
};

// Request interceptor - attach token from cookies if available
$http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // If Authorization header is not set, try to get from sessionStorage
    if (!config.headers.Authorization) {
      const token = sessionStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle 401 and auto-refresh
$http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return $http(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint
        const response = await fetch("/api/auth/refresh-token", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Token refresh failed");
        }

        const data = await response.json();

        if (!data.success || !data.access_token) {
          throw new Error("Invalid refresh response");
        }

        const newAccessToken = data.access_token;

        // Update token in sessionStorage
        sessionStorage.setItem("access_token", newAccessToken);

        // Update axios default header
        addAccessTokenToHttpInstance(newAccessToken);

        // Update the failed request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        return $http(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        // Clear tokens
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        removeAccessTokenFromHttpInstance();

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
