import { ENVIRONMENT_VARIABLES } from "../config/environment-variables";

export const getRefreshTokenKey = (refreshToken: string) =>
  `${ENVIRONMENT_VARIABLES.APP.NAME}:refresh-tokens:${refreshToken}`;
