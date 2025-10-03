type Config = {
  app: {
    name: string;
    version: string;
    port: number;
    environment: string;
  };
  openid?: {
    issuer: string;
    clientId: string;
  };
  jwt: {
    jwtSecret: string;
    jwtExpiresIn: string;
    algorithm: string;
  };
  cors?: {
    origin: string;
    methods: string[];
    credentials: boolean;
  };
};

const env = process.env.NODE_ENV || "development";

const development = {
  app: {
    name: "MindX Backend API - Development",
    version: "1.0.0",
    port: 8000,
    environment: "development",
  },
  openid: {
    issuer: process.env.OIDC_ISSUER || "https://accounts.google.com",
    clientId: process.env.OIDC_CLIENT_ID || "your-client-id",
  },
  jwt: {
    jwtSecret:
      process.env.JWT_SECRET || "mindx-secret-key-change-in-development",
    jwtExpiresIn: "24h",
    algorithm: "HS256",
  },
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
};

const production = {
  app: {
    name: "MindX Backend API",
    version: "1.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 8000,
    environment: "production",
  },
  jwt: {
    jwtSecret: process.env.JWT_SECRET || "mindx-secret-key-change",
    jwtExpiresIn: "24h",
    algorithm: "HS256",
  },
  cors: {
    origin: process.env.FRONTEND_URL || "https://your-production-frontend.com",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
};

const config: { [key: string]: Config } = {
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
