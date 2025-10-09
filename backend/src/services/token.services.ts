import { getRefreshTokenKey } from "../utils";
import { config, redisClient } from "../config";
import jwt from "jsonwebtoken";

class TokenService {
  generateAccessToken(payload: any): string {
    return jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {
      algorithm: config.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: config.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  verifyAccessToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return reject(null);
        }
        resolve(decoded);
      });
    });
  }

  generateRefreshToken(payload: any): string {
    return jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
      algorithm: config.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  verifyRefreshToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  }

  async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const key = getRefreshTokenKey(refreshToken);
    await redisClient.hset(key, { userId });
    await redisClient.expire(key, config.REFRESH_TOKEN_EXPIRES_IN);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await redisClient.del(getRefreshTokenKey(refreshToken));
  }

  async generateAccessTokenAndRefreshToken(userId: number): Promise<{
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
        await redisClient.set(key, "1");
        await redisClient.expire(key, expiresIn);
      }
    } catch (error) {
      throw error;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await redisClient.get(key);
    return result !== null;
  }
}

export const tokenService = new TokenService();
