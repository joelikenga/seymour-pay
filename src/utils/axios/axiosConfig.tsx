import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  getToken,
  removeToken,
  getAdminToken,
  removeAdminToken,
} from "../cookies";

// Create a separate export for network status management
export let setNetworkError: (status: boolean) => void;
export let onAuthError: (() => void) | null = null;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

export const configureAxiosNetworkHandling = (
  networkErrorSetter: typeof setNetworkError
) => {
  setNetworkError = networkErrorSetter;
};

export const configureAxiosAuthHandling = (authErrorHandler: () => void) => {
  onAuthError = authErrorHandler;
};

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Try admin token first, then fallback to regular token
    const accessToken = getAdminToken() || getToken();

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        setNetworkError?.(true);
        throw new Error(
          "Network timeout. Please check your internet connection."
        );
      } else if (error.code === "ERR_NETWORK") {
        setNetworkError?.(true);
        throw new Error(
          "No Internet connection. Please check your internet connection."
        );
      } else {
        setNetworkError?.(true);
        throw new Error(error.code);
      }
    }

    const errBody = error.response.data as { message?: string }

    if (error.response.status === 401) {
      if (errBody.message === "Invalid email or password") {
        throw new Error(errBody.message || "Unauthorized access");
      }
      if (errBody.message === "Token expired") {
        removeAdminToken();
        removeToken();
        // Notify AuthContext about auth error
        if (onAuthError) {
          onAuthError();
        }
        throw new Error(errBody.message || "Unauthorized access");
      }
      if (
        errBody.message ===
        "Session is not active. Please login again"
      ) {
        removeAdminToken();
        removeToken();
        // Notify AuthContext about auth error
        if (onAuthError) {
          onAuthError();
        }
        throw new Error(errBody.message || "Unauthorized access");
      }
      if (errBody.message === "User not found") {
        removeAdminToken();
        removeToken();
        // Notify AuthContext about auth error
        if (onAuthError) {
          onAuthError();
        }
        throw new Error(errBody.message || "Unauthorized access");
      }

      // For any other 401 errors
      removeAdminToken();
      removeToken();
      // Notify AuthContext about auth error
      if (onAuthError) {
        onAuthError();
      }
      throw new Error(
        errBody.message ||
          "Unauthorized access. Please log in again."
      );
    }

    throw new Error(errBody.message || "An error occurred.");
  }
);

export default axiosInstance;
