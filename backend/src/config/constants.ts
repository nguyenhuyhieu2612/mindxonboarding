const env = process.env.NODE_ENV || "development";

const development = {
  name: "MindX Backend API - Development",
  version: "1.0.0",
  port: 8000,
  environment: "development",
  jwtSecret: process.env.JWT_SECRET || "mindx-secret-key-change-in-development",
  jwtExpiresIn: "24h",
};

const production = {
  name: "MindX Backend API - Production",
  version: "1.0.0",
  port: 8000,
  environment: "production",
  jwtSecret: process.env.JWT_SECRET || "mindx-secret-key-change-in-production",
  jwtExpiresIn: "24h",
};

const config = {
  development,
  production,
};

export const APP_CONFIG = config[env as keyof typeof config];

export const API_MESSAGES = {
  SUCCESS: "Operation successful",
  ERROR: "Operation failed",
  UNAUTHORIZED: "Unauthorized access",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
};
