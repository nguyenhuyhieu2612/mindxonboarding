// ✅ Load env first
import dotenv from "dotenv";
dotenv.config();

// ✅ Initialize App Insights before other configs
import { initializeAppInsights } from "./config";
initializeAppInsights();

// ✅ Import dependencies that use env vars
import "./config/passport";
import "./config/redis-client";
import "./config/prisma-client";

import http from "http";
import app from "./app";
import { config } from "./config";
import { logger } from "./utils";
import { ragService } from "./services";

// --- Initialize services ---
async function initializeServices() {
  try {
    logger.info("Initializing services...");
    await ragService.initialize();
    logger.info("All services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize services", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't exit - server can still run without RAG
  }
}

// --- Create and start server ---
const server = http.createServer(app);

server.listen(config.PORT, async () => {
  logger.info(`🚀 Server running at http://localhost:${config.PORT}`);
  await initializeServices();
});

// --- Graceful shutdown handlers ---
async function shutdown(signal: string) {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info("Server closed. Flushing telemetry...");
    logger.info("Telemetry flushed. Exiting.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
