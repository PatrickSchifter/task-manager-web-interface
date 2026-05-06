import axios from "axios";
import type { AxiosRequestHeaders } from "axios";

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export type ApiClient = typeof apiClient;

// Attach token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      // Axios v1 may use AxiosHeaders which supports set()
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
