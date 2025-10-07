import { TokenResponse } from "types/auth.types";
import { ENVIRONMENT_VARIABLES } from "../config/environment-variables";
import { logger } from "../utils/logger";
import axios from "axios";
import jwt from "jsonwebtoken";

class AuthService {
  getAuthorizationURL(state: string): string {
    const params = new URLSearchParams({
      client_id: ENVIRONMENT_VARIABLES.OPENID.CLIENT_ID,
      redirect_uri: ENVIRONMENT_VARIABLES.OPENID.REDIRECT_URI,
      response_type: ENVIRONMENT_VARIABLES.OPENID.RESPONSE_TYPE,
      scope: ENVIRONMENT_VARIABLES.OPENID.SCOPE,
      state,
    });

    return `${
      ENVIRONMENT_VARIABLES.OPENID.AUTHORIZATION_ENDPOINT
    }?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: ENVIRONMENT_VARIABLES.OPENID.REDIRECT_URI,
        client_id: ENVIRONMENT_VARIABLES.OPENID.CLIENT_ID,
        client_secret: ENVIRONMENT_VARIABLES.OPENID.CLIENT_SECRET,
      });

      const response = await axios.post<TokenResponse>(
        ENVIRONMENT_VARIABLES.OPENID.TOKEN_ENDPOINT,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error("❌ Error exchanging code for tokens", {
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
      logger.error("❌ Error decoding ID token:", error);
      throw new Error("Failed to decode ID token");
    }
  }
}

export const authService = new AuthService();
