import { getRefreshTokenKey } from "../utils/key";
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
            return reject(null);
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

  async blacklistAccessToken(token: string): Promise<void> {
    try {
      const decoded = await this.verifyAccessToken(token);
      const key = `blacklist:${token}`;
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        await redis.set(key, "1");
        await redis.expire(key, expiresIn);
      }
    } catch (error) {
      throw error;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await redis.get(key);
    return result !== null;
  }
}

export const tokenService = new TokenService();
