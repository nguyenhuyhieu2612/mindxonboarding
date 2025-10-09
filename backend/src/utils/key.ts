import config from "../config/config";

export const getRefreshTokenKey = (refreshToken: string) =>
  `${config.APP_NAME}:refresh-tokens:${refreshToken}`;
