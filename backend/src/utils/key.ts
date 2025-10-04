import { APP_CONFIG } from "../config/config";

export const getRefreshTokenKey = (refreshToken: string) =>
  `${APP_CONFIG.app.name}:refresh-tokens:${refreshToken}`;
