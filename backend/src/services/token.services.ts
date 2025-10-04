import { getRefreshTokenKey } from "utils/key";
import { APP_CONFIG } from "../config/config";
import redis from "../config/redis-client";
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

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const key = getRefreshTokenKey(refreshToken);
    await redis.hset(key, { userId });
    await redis.expire(key, APP_CONFIG.session.refreshTokenExpiresIn);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await redis.del(getRefreshTokenKey(refreshToken));
  }

  async generateAccessTokenAndRefreshToken(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { userId };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    await this.saveRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken };
  }
}

export const tokenService = new TokenService();
