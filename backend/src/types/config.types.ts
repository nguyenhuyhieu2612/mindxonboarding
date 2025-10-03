type AppConfig = {
  name: string;
  version: string;
  port: number;
  environment: "development" | "production" | string;
};

type OpenIDConfig = {
  issuer: string;
  clientId: string;
};

type JWTConfig = {
  jwtSecret: string;
  jwtExpiresIn: string;
  algorithm: string;
};

type CORSConfig = {
  origin: string;
  methods: string[];
  credentials: boolean;
};

export type Config = {
  app: AppConfig;
  openid?: OpenIDConfig;
  jwt: JWTConfig;
  cors?: CORSConfig;
};
export type { AppConfig, OpenIDConfig, JWTConfig, CORSConfig };
