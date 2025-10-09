// ✅ Load env first
import dotenv from "dotenv";
dotenv.config();

// ✅ Initialize App Insights before other configs
import { initializeAppInsights } from "./config/app-insights";
initializeAppInsights();

// ✅ Import dependencies that use env vars
import "./config/passport";
import "./config/redis-client";
import "./config/prisma-client";

import http from "http";
import app from "./app";
import { config } from "./config";
import { logger, flushTelemetry } from "./utils";

// --- Create and start server ---
const server = http.createServer(app);

server.listen(config.PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${config.PORT}`);
});

// --- Graceful shutdown handlers ---
async function shutdown(signal: string) {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info("Server closed. Flushing telemetry...");
    await flushTelemetry();
    logger.info("Telemetry flushed. Exiting.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
