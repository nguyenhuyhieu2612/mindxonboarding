import { TokenResponse } from "types/auth.types";
import { APP_CONFIG } from "../config/config";
import { logger } from "../utils/logger";
import axios from "axios";
import jwt from "jsonwebtoken";

class AuthService {
  getAuthorizationURL(state: string): string {
    logger.info("Scope:", APP_CONFIG.openid);
    const params = new URLSearchParams({
      client_id: APP_CONFIG.openid.clientId,
      redirect_uri: APP_CONFIG.openid.callbackURL,
      response_type: "code",
      scope: APP_CONFIG.openid.scope,
      state,
    });

    return `${APP_CONFIG.openid.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    try {
      logger.info("🔄 Preparing token exchange request", {
        tokenEndpoint: APP_CONFIG.openid.tokenEndpoint,
        clientId: APP_CONFIG.openid.clientId,
        redirectUri: APP_CONFIG.openid.callbackURL,
        codeLength: code.length,
        clientSecretPresent: !!APP_CONFIG.openid.clientSecret,
        clientSecretLength: APP_CONFIG.openid.clientSecret?.length,
      });

      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: APP_CONFIG.openid.callbackURL,
        client_id: APP_CONFIG.openid.clientId,
        client_secret: APP_CONFIG.openid.clientSecret,
      });

      logger.info("📤 Sending token exchange request", {
        url: APP_CONFIG.openid.tokenEndpoint,
        bodyParams: {
          grant_type: "authorization_code",
          code: code.substring(0, 10) + "...",
          redirect_uri: APP_CONFIG.openid.callbackURL,
          client_id: APP_CONFIG.openid.clientId,
          client_secret_first_10: APP_CONFIG.openid.clientSecret.substring(0, 10) + "...",
        },
      });

      const response = await axios.post<TokenResponse>(
        APP_CONFIG.openid.tokenEndpoint,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );

      logger.info("Token exchange successful", {
        hasAccessToken: !!response.data.access_token,
        hasIdToken: !!response.data.id_token,
        hasRefreshToken: !!response.data.refresh_token,
      });

      return response.data;
    } catch (error: any) {
      logger.error("Error exchanging code for tokens", {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw new Error("Failed to exchange code for tokens");
    }
  }

  getUserInfo(
    token: string,
    tokenType: "access_token" | "id_token" = "access_token"
  ): Promise<any> {
    return this.callUserInfoEndpoint(token);
  }

  private async callUserInfoEndpoint(token: string): Promise<any> {
    // do something
  }

  decodeIDToken(idToken: string): any {
    try {
      const decoded = jwt.decode(idToken);

      if (!decoded || typeof decoded === "string") {
        throw new Error("Invalid ID token");
      }

      return {
        userId: decoded.sub,
      };
    } catch (error) {
      logger.error("Error decoding ID token:", error);
      throw new Error("Failed to decode ID token");
    }
  }
}

export const authService = new AuthService();
