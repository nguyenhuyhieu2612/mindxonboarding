import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().optional(),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),

  FRONTEND_URL: z.string().default("http://localhost:5173"),
  OIDC_ISSUER: z.string().min(1, "OIDC_ISSUER is required"),

  OIDC_CLIENT_ID: z.string().min(1, "OIDC_CLIENT_ID is required"),
  OIDC_CLIENT_SECRET: z.string().min(1, "OIDC_CLIENT_SECRET is required"),
  OIDC_REDIRECT_URI: z.string().min(1, "OIDC_REDIRECT_URI is required"),

  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

const ENV = parsedEnv.data;

const BASE_VARIABLES = {
  JWT: {
    SECRET: ENV.JWT_SECRET,
    EXPIRES_IN: "24h",
    ALGORITHM: "HS256" as const,
  },
  SESSION: {
    ACCESS_TOKEN: {
      SECRET: ENV.ACCESS_TOKEN_SECRET,
      EXPIRES_IN: 900,
    },
    REFRESH_TOKEN: {
      SECRET: ENV.REFRESH_TOKEN_SECRET,
      EXPIRES_IN: 604800,
    },
  },
  CORS: {
    ORIGIN: ENV.FRONTEND_URL,
    METHODS: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    CREDENTIALS: true,
  },
  OPENID: {
    ISSUER: ENV.OIDC_ISSUER,
    AUTHORIZATION_ENDPOINT: `${ENV.OIDC_ISSUER}/auth`,
    TOKEN_ENDPOINT: `${ENV.OIDC_ISSUER}/token`,
    USERINFO_ENDPOINT: `${ENV.OIDC_ISSUER}/me`,
    JWKS_URI: `${ENV.OIDC_ISSUER}/jwks`,
    CLIENT_ID: ENV.OIDC_CLIENT_ID,
    CLIENT_SECRET: ENV.OIDC_CLIENT_SECRET,
    REDIRECT_URI: ENV.OIDC_REDIRECT_URI,
    SCOPE: "openid profile email",
    RESPONSE_TYPE: "code",
  },
  REDIS: {
    HOST: ENV.REDIS_HOST,
    PORT: ENV.REDIS_PORT,
    PASSWORD: ENV.REDIS_PASSWORD || "",
  },
  AZURE: {
    APPLICATIONINSIGHTS_CONNECTION_STRING:
      ENV.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
};

const ENVIRONMENT_VARIABLES_MAP = {
  development: {
    NAME: "MindX Backend API - Development",
    VERSION: "1.0.0",
    PORT: ENV.PORT ? parseInt(ENV.PORT) : 3000,
    ENVIRONMENT: "development" as const,
  },
  production: {
    NAME: "MindX Backend API",
    VERSION: "1.0.0",
    PORT: ENV.PORT ? parseInt(ENV.PORT) : 3000,
    ENVIRONMENT: "production" as const,
  },
};

export const ENVIRONMENT_VARIABLES = {
  APP: ENVIRONMENT_VARIABLES_MAP[ENV.NODE_ENV],
  ...BASE_VARIABLES,
  FRONTEND_URL: ENV.FRONTEND_URL,
};
