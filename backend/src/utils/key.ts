import { config } from "../config";

export const getRefreshTokenKey = (refreshToken: string) =>
  `${config.APP_NAME}:refresh-tokens:${refreshToken}`;
