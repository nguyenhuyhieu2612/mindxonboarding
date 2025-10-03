type AppConfig = {
  name: string;
  version: string;
  port: number;
  environment: "development" | "production" | string;
};

type OpenIDConfig = {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  jwksUri: string;
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope: string;
  responseType: string;
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
  frontendURL: string;
};

type SessionConfig = {
  accessTokenSecret: string;
  accessTokenExpiresIn: number;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: number;
};

export type Config = {
  app: AppConfig;
  openid: OpenIDConfig;
  jwt: JWTConfig;
  cors: CORSConfig;
  session: SessionConfig;
};
export type { AppConfig, OpenIDConfig, JWTConfig, CORSConfig };
