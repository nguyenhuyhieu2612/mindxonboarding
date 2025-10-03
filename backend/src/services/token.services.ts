import { APP_CONFIG } from "../config/config";
import jwt from "jsonwebtoken";

class TokenService {
  generateAccessToken(payload: any): string {
    return jwt.sign(payload, APP_CONFIG.session.accessTokenSecret, {
      algorithm: APP_CONFIG.jwt.algorithm as jwt.Algorithm,
      expiresIn: APP_CONFIG.session.accessTokenExpiresIn,
    });
  }

  verifyAccessToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        APP_CONFIG.session.accessTokenSecret,
        (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        }
      );
    });
  }

  generateRefreshToken(payload: any): string {
    return jwt.sign(payload, APP_CONFIG.session.refreshTokenSecret, {
      algorithm: APP_CONFIG.jwt.algorithm as jwt.Algorithm,
      expiresIn: APP_CONFIG.session.refreshTokenExpiresIn,
    });
  }

  verifyRefreshToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        APP_CONFIG.session.refreshTokenSecret,
        (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        }
      );
    });
  }

  saveRefreshToken(userId: string, refreshToken: string): void {
    // Implement saving refresh token to database or in-memory store
  }

  revokeRefreshToken(userId: string): void {
    // Implement revoking refresh token from database or in-memory store
  }

  generateAccessTokenAndRefreshToken(userId: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { userId };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    this.saveRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken };
  }
}

export const tokenService = new TokenService();
