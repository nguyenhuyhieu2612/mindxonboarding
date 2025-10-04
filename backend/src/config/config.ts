import { z } from "zod";
import { Config } from "../types/config.types";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().optional(),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("900"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("604800"),

  OIDC_ISSUER: z.string().min(1, "OIDC_ISSUER is required"),
  OIDC_AUTHORIZATION_ENDPOINT: z
    .string()
    .min(1, "OIDC_AUTHORIZATION_ENDPOINT is required"),
  OIDC_TOKEN_ENDPOINT: z.string().min(1, "OIDC_TOKEN_ENDPOINT is required"),
  OIDC_USERINFO_ENDPOINT: z
    .string()
    .min(1, "OIDC_USERINFO_ENDPOINT is required"),
  OIDC_JWKS_URI: z.string().min(1, "OIDC_JWKS_URI is required"),
  OIDC_CLIENT_ID: z.string().min(1, "OIDC_CLIENT_ID is required"),
  OIDC_CLIENT_SECRET: z.string().min(1, "OIDC_CLIENT_SECRET is required"),
  OIDC_REDIRECT_URI: z.string().min(1, "OIDC_REDIRECT_URI is required"),
  OIDC_SCOPE: z.string().min(1, "OIDC_SCOPE is required"),
  OIDC_RESPONSE_TYPE: z.string().min(1, "OIDC_RESPONSE_TYPE is required"),

  FRONTEND_URL: z.string().default("http://localhost:5173"),

  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

const ENV = parsedEnv.data;

const development: Config = {
  app: {
    name: "MindX Backend API - Development",
    version: "1.0.0",
    port: ENV.PORT ? parseInt(ENV.PORT) : 3000,
    environment: "development",
  },
  jwt: {
    jwtSecret: ENV.JWT_SECRET,
    jwtExpiresIn: ENV.JWT_EXPIRES_IN,
    algorithm: "HS256",
  },
  session: {
    accessTokenSecret: ENV.ACCESS_TOKEN_SECRET,
    accessTokenExpiresIn: parseInt(ENV.ACCESS_TOKEN_EXPIRES_IN),
    refreshTokenSecret: ENV.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: parseInt(ENV.REFRESH_TOKEN_EXPIRES_IN),
  },
  cors: {
    origin: ENV.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    frontendURL: ENV.FRONTEND_URL,
  },
  openid: {
    issuer: ENV.OIDC_ISSUER,
    authorizationEndpoint: ENV.OIDC_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: ENV.OIDC_TOKEN_ENDPOINT,
    userInfoEndpoint: ENV.OIDC_USERINFO_ENDPOINT,
    jwksUri: ENV.OIDC_JWKS_URI,
    clientId: ENV.OIDC_CLIENT_ID,
    clientSecret: ENV.OIDC_CLIENT_SECRET,
    callbackURL: ENV.OIDC_REDIRECT_URI,
    scope: ENV.OIDC_SCOPE,
    responseType: ENV.OIDC_RESPONSE_TYPE,
  },
  redis: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD!,
  },
};

const production: Config = {
  app: {
    name: "MindX Backend API",
    version: "1.0.0",
    port: ENV.PORT ? parseInt(ENV.PORT) : 3000,
    environment: "production",
  },
  jwt: {
    jwtSecret: ENV.JWT_SECRET,
    jwtExpiresIn: ENV.JWT_EXPIRES_IN,
    algorithm: "HS256",
  },
  session: {
    accessTokenSecret: ENV.ACCESS_TOKEN_SECRET,
    accessTokenExpiresIn: parseInt(ENV.ACCESS_TOKEN_EXPIRES_IN),
    refreshTokenSecret: ENV.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: parseInt(ENV.REFRESH_TOKEN_EXPIRES_IN),
  },
  cors: {
    origin: ENV.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    frontendURL: ENV.FRONTEND_URL,
  },
  openid: {
    issuer: ENV.OIDC_ISSUER,
    authorizationEndpoint: ENV.OIDC_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: ENV.OIDC_TOKEN_ENDPOINT,
    userInfoEndpoint: ENV.OIDC_USERINFO_ENDPOINT,
    jwksUri: ENV.OIDC_JWKS_URI,
    clientId: ENV.OIDC_CLIENT_ID,
    clientSecret: ENV.OIDC_CLIENT_SECRET,
    callbackURL: ENV.OIDC_REDIRECT_URI,
    scope: ENV.OIDC_SCOPE,
    responseType: ENV.OIDC_RESPONSE_TYPE,
  },
  redis: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD!,
  },
};

const config: { [key: string]: Config } = {
  development,
  production,
};

export const APP_CONFIG = config[ENV.NODE_ENV];
