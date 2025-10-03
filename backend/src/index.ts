import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import compression from "compression";
import { APP_CONFIG } from "./config/config";
import { logger } from "./utils/logger";
import router from "./routes";

dotenv.config();

const app = express();
const PORT = APP_CONFIG.app.port;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.use(compression());

// Health check endpoint (no auth required)

app.use(router);

app.get("/health", (req: Request, res: Response) => {
  logger.debug("Health check request");
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: APP_CONFIG.app.environment,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      APP_CONFIG.app.environment === "production"
        ? "Something went wrong"
        : err.message,
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT} (${APP_CONFIG.app.environment})`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.warn("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.warn("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export default app;
