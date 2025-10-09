import Redis from "ioredis";
import config from "./config";
import { logger } from "../utils/logger";

const client = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
});

client.on("connect", () => {
  logger.info("✅ Connected to Redis successfully");
});

client.on("error", (err) => {
  logger.error("❌ Failed to connect Redis:", err);
});

export default client;
