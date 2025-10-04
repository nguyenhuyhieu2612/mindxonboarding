import { TokenResponse } from "types/auth.types";
import { APP_CONFIG } from "../config/config";
import { logger } from "utils/logger";
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
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: APP_CONFIG.openid.callbackURL,
        client_id: APP_CONFIG.openid.clientId,
        client_secret: APP_CONFIG.openid.clientSecret,
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
    try {
      logger.info("Calling UserInfo endpoint with token");
      const response = await axios.get(APP_CONFIG.openid.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      const data = response.data;
      logger.info("UserInfo response:", data);

      return {
        sub: data.sub,
        email: data.email || "",
        name: data.name || data.given_name || data.family_name || "",
        picture: data.picture || "",
        email_verified: data.email_verified || false,
      };
    } catch (error: any) {
      logger.error("Error calling UserInfo endpoint:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw new Error("Failed to fetch user info from UserInfo endpoint");
    }
  }

  decodeIDToken(idToken: string): any {
    try {
      const decoded = jwt.decode(idToken);

      if (!decoded || typeof decoded === "string") {
        throw new Error("Invalid ID token");
      }

      logger.info("Decoded ID token (full):", decoded);
      logger.info("Available claims:", Object.keys(decoded));

      const hasProfileClaims = decoded.email || decoded.name;

      if (!hasProfileClaims) {
        logger.warn(
          "Profile claims missing, generating temporary profile from sub"
        );
        return this.generateTemporaryProfile(decoded.sub!);
      }

      return {
        sub: decoded.sub,
        email: decoded.email || "",
        name: decoded.name || decoded.given_name || "",
        picture: decoded.picture || "",
        email_verified: decoded.email_verified || false,
      };
    } catch (error) {
      logger.error("Error decoding ID token:", error);
      throw new Error("Failed to decode ID token");
    }
  }

  private generateTemporaryProfile(sub: string): any {
    const shortId = sub.substring(0, 8);

    return {
      sub: sub,
      email: `user-${shortId}@temp.mindx.local`,
      name: `User ${shortId}`,
      picture: `https://ui-avatars.com/api/?name=User+${shortId}&background=667eea&color=fff`,
      email_verified: false,
      _isTemporary: true,
    };
  }
}

export const authService = new AuthService();
