import axios from "axios";
import { ApiResponse } from "./api.types";
import api, { API_BASE_URL } from "./api";
import { appInsights } from "@/app-insights";

const root = "/auth";

export const refreshToken = async (): Promise<
  ApiResponse<{ accessToken: string }>
> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${root}/refresh-token`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    appInsights.trackException({
      exception: error as Error,
      properties: {},
    });
    throw error;
  }
};

export const logout = async () => {
  const response = await api.post(`${root}/logout`);

  return response.data;
};

export const getHealth = async () => {
  const response = await api.get<{
    status: string;
    timestamp: string;
    uptime: string;
    environment: string;
  }>("/health");

  return response.data;
};
