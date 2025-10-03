import { JWTPayload, TokenResponse, UserInfo } from "types/auth.types";
import { APP_CONFIG } from "../config/config";
import { logger } from "utils/logger";
import axios from "axios";
import jwt from "jsonwebtoken";

class AuthService {
  getAuthorizationURL(state: string): string {
    const params = new URLSearchParams({
      client_id: APP_CONFIG.openid.clientId,
      redirect_uri: APP_CONFIG.openid.callbackURL,
      response_type: "code",
      scope: APP_CONFIG.openid.scope,
      state,
    });

    return `${APP_CONFIG.openid.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const response = await axios.post<TokenResponse>(
        APP_CONFIG.openid.tokenEndpoint,
        {
          grant_type: "authorization_code",
          code,
          redirect_uri: APP_CONFIG.openid.callbackURL,
          client_id: APP_CONFIG.openid.clientId,
          client_secret: APP_CONFIG.openid.clientSecret,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error exchanging code for tokens", { error });
      throw new Error("Failed to exchange code for tokens");
    }
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get<UserInfo>(
        APP_CONFIG.openid.userInfoEndpoint,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error fetching user info", { error });
      throw new Error("Failed to fetch user info");
    }
  }

  generateJWT(user: UserInfo): string {
    const payload: JWTPayload = {
      sub: user.sub,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    return jwt.sign(payload, APP_CONFIG.jwt.jwtSecret, {
      algorithm: APP_CONFIG.jwt.algorithm as jwt.Algorithm,
    });
  }
}

export const authService = new AuthService();
