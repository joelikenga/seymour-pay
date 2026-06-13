import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  ADMIN_ACCESS_DENIED_MESSAGE,
  AXIOS_ERR_NETWORK_USER_MESSAGE,
  messageIndicatesAdminAccessDenied,
} from "../../lib/apiErrors";
import {
  getToken,
  removeToken,
  getAdminToken,
  removeAdminToken,
} from "../cookies";
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

async function readApiErrorBody(
  data: unknown,
): Promise<{ message?: string; error?: string }> {
  if (data instanceof Blob) {
    try {
      const text = (await data.text()).trim();
      if (!text) return {};
      try {
        return JSON.parse(text) as { message?: string; error?: string };
      } catch {
        return { message: text.slice(0, 300) };
      }
    } catch {
      return {};
    }
  }
  if (data && typeof data === "object") {
    return data as { message?: string; error?: string };
  }
  return {};
}

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        setNetworkError?.(true);
        throw new Error(
          "Network timeout. Please check your internet connection."
        );
      } else if (error.code === "ERR_NETWORK") {
        setNetworkError?.(true);
        throw new Error(
          AXIOS_ERR_NETWORK_USER_MESSAGE
        );
      } else {
        setNetworkError?.(true);
        throw new Error(error.code);
      }
    }

    const errBody = await readApiErrorBody(error.response.data)

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

    const status = error.response.status
    const rawMsg =
      (typeof errBody.message === "string" ? errBody.message.trim() : "") ||
      (typeof errBody.error === "string" ? errBody.error.trim() : "")

    if (status === 403) {
      throw new Error(ADMIN_ACCESS_DENIED_MESSAGE)
    }
    if (messageIndicatesAdminAccessDenied(rawMsg)) {
      throw new Error(ADMIN_ACCESS_DENIED_MESSAGE)
    }

    throw new Error(rawMsg || "An error occurred.");
  }
);

export default axiosInstance;
