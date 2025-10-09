import Redis from "ioredis";
import { config } from "./config";
import { logger } from "../utils";

export const redisClient = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
});

redisClient.on("connect", () => {
  logger.info("✅ Connected to Redis successfully");
});

redisClient.on("error", (err) => {
  logger.error("❌ Failed to connect Redis:", err);
});
