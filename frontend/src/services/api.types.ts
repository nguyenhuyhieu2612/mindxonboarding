export interface ApiResponse {
  message: string;
  version: string;
  step: string;
  timestamp: string;
  environment: string;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

export interface ApiInfo {
  name: string;
  description: string;
  endpoints: {
    root: string;
    health: string;
    info: string;
  };
  documentation?: string;
}
