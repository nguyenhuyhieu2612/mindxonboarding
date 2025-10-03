import axios from "axios";
import type { ApiInfo, HealthStatus, ApiResponse } from "./api.types";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);

    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error("No response from server. Please check your connection.");
    } else {
      throw new Error(`Request Error: ${error.message}`);
    }
  }
);

export const apiClient = {
  async getRoot(): Promise<ApiResponse> {
    const response = await axiosInstance.get<ApiResponse>("/");
    return response.data;
  },

  async getHealth(): Promise<HealthStatus> {
    const response = await axiosInstance.get<HealthStatus>("/health");
    return response.data;
  },

  async getInfo(): Promise<ApiInfo> {
    const response = await axiosInstance.get<ApiInfo>("/info");
    return response.data;
  },
};

export default apiClient;
