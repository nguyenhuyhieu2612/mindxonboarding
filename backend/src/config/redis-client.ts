import Redis from "ioredis";
import { APP_CONFIG } from "./config";

const client = new Redis({
  host: APP_CONFIG.redis.host,
  port: APP_CONFIG.redis.port,
  password: APP_CONFIG.redis.password,
});

export default client;
