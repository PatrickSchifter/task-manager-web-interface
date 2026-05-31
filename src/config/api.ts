import axios from "axios";
import type { AxiosRequestHeaders } from "axios";

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export type ApiClient = typeof apiClient;

// Event para comunicar 401 ao React sem dependência circular
export const authEvents = new EventTarget();

// Attach token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      if (typeof config.headers?.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers ?? {}),
          Authorization: `Bearer ${token}`,
        } as AxiosRequestHeaders;
      }
    }
  } catch {
    // ignore storage errors
  }
  return config;
});

// Auto logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authEvents.dispatchEvent(new Event("unauthorized"));
    }
    return Promise.reject(error);
  },
);
