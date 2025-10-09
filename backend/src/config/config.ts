import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().optional(),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),

  FRONTEND_URL: z.string().default("http://localhost:5173"),

  MINDX_ISSUER: z.string().min(1, "MINDX_ISSUER is required"),
  MINDX_CLIENT_ID: z.string().min(1, "MINDX_CLIENT_ID is required"),
  MINDX_CLIENT_SECRET: z.string().min(1, "MINDX_CLIENT_SECRET is required"),
  MINDX_REDIRECT_URI: z.string().min(1, "MINDX_REDIRECT_URI is required"),

  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z.string().min(1, "GOOGLE_REDIRECT_URI is required"),

  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),

  POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST is required"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().min(1, "POSTGRES_USER is required"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD is required"),
  POSTGRES_DB_NAME: z.string().min(1, "POSTGRES_DB_NAME is required"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  process.exit(1);
}

const raw = result.data;

const DATABASE_URL = `postgresql://${raw.POSTGRES_USER}:${raw.POSTGRES_PASSWORD}@${raw.POSTGRES_HOST}:${raw.POSTGRES_PORT}/${raw.POSTGRES_DB_NAME}`;

export const config = {
  NODE_ENV: raw.NODE_ENV,
  PORT: raw.PORT ? parseInt(raw.PORT, 10) : 3000,
  FRONTEND_URL: raw.FRONTEND_URL,
  APP_NAME:
    raw.NODE_ENV === "production"
      ? "MindX Backend API"
      : "MindX Backend API - Development",
  APP_VERSION: "1.0.0",

  JWT_SECRET: raw.JWT_SECRET,
  JWT_EXPIRES_IN: "24h",
  JWT_ALGORITHM: "HS256",

  ACCESS_TOKEN_SECRET: raw.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: 900, // 15 minutes

  REFRESH_TOKEN_SECRET: raw.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: 604800, // 7 days

  CORS_ORIGIN: raw.FRONTEND_URL,
  CORS_METHODS: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  CORS_CREDENTIALS: true,

  MINDX_ISSUER: raw.MINDX_ISSUER,
  MINDX_AUTH_URL: `${raw.MINDX_ISSUER}/auth`,
  MINDX_TOKEN_URL: `${raw.MINDX_ISSUER}/token`,
  MINDX_USERINFO_URL: `${raw.MINDX_ISSUER}/me`,
  MINDX_JWKS_URL: `${raw.MINDX_ISSUER}/jwks`,
  MINDX_CLIENT_ID: raw.MINDX_CLIENT_ID,
  MINDX_CLIENT_SECRET: raw.MINDX_CLIENT_SECRET,
  MINDX_REDIRECT_URI: raw.MINDX_REDIRECT_URI,
  MINDX_SCOPE: ["openid", "profile", "email"],

  REDIS_HOST: raw.REDIS_HOST,
  REDIS_PORT: raw.REDIS_PORT,
  REDIS_PASSWORD: raw.REDIS_PASSWORD || "",

  GOOGLE_CLIENT_ID: raw.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: raw.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: raw.GOOGLE_REDIRECT_URI,
  GOOGLE_SCOPE: ["profile", "email"],

  APPLICATIONINSIGHTS_CONNECTION_STRING:
    raw.APPLICATIONINSIGHTS_CONNECTION_STRING,

  POSTGRES_HOST: raw.POSTGRES_HOST,
  POSTGRES_PORT: raw.POSTGRES_PORT,
  POSTGRES_USER: raw.POSTGRES_USER,
  POSTGRES_PASSWORD: raw.POSTGRES_PASSWORD,
  POSTGRES_DB_NAME: raw.POSTGRES_DB_NAME,

  DATABASE_URL,
};
