import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
} from "axios";
import { ApiResponse } from "./api.types";
import { refreshToken } from "./auth";
import { store } from "@/store";
import { logoutAccount, setAccessToken } from "@/store/auth.slice";

export const API_BASE_URL =
  (import.meta as any).env?.DEV === true ? "http://localhost:3000" : "/api";

const defaultParams: CreateAxiosDefaults = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};

const axiosInstance = axios.create(defaultParams);

let isRefreshing = false;

let queue: {
  resolve: (data: unknown) => void;
  reject: (reason: unknown) => void;
}[] = [];

const processQueue = (error: unknown = null, token: string | null = null) => {
  queue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  queue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((error) =>
            Promise.reject(
              error.response.data.message || "An unknow error occurred"
            )
          );
      }
      isRefreshing = true;
      try {
        const { data } = await refreshToken();
        store.dispatch(setAccessToken(data!));
        originalRequest.headers.Authorization = `Bearer ${data!}`;
        processQueue(null, data?.accessToken);
        return axios(originalRequest);
      } catch (error) {
        processQueue(error, null);
        store.dispatch(logoutAccount());
        window.location.href = "/login";
        return Promise.reject(
          (error as any).response.data?.message || "An unknow error occurred"
        );
      }
    }
    return Promise.reject(
      error.response?.data?.message || "An unknow error occurred"
    );
  }
);

axiosInstance.interceptors.request.use(
  (request) => {
    const { accessToken } = store.getState().auth;
    if (accessToken) {
      request.headers.Authorization = `Bearer ${accessToken}`;
    }
    return request;
  },
  (error) => Promise.reject(error)
);

const api = (axios: AxiosInstance) => {
  return {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      axios.get<ApiResponse<T>>(url, config),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      axios.post<ApiResponse<T>>(url, data, config),
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      axios.put<ApiResponse<T>>(url, data, config),
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      axios.patch<ApiResponse<T>>(url, data, config),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
      axios.delete<ApiResponse<T>>(url, config),
  };
};

export default api(axiosInstance);
