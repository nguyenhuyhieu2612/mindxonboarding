import Redis from "ioredis";
import { ENVIRONMENT_VARIABLES } from "./environment-variables";

const client = new Redis({
  host: ENVIRONMENT_VARIABLES.REDIS.HOST,
  port: ENVIRONMENT_VARIABLES.REDIS.PORT,
  password: ENVIRONMENT_VARIABLES.REDIS.PASSWORD,
});

export default client;
