import dotenv from "dotenv";
import { initializeAppInsights } from "./config/app-insights";
dotenv.config();
initializeAppInsights();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { ENVIRONMENT_VARIABLES } from "./config/environment-variables";
import { logger } from "./utils/logger";
import { flushTelemetry } from "./utils/telemetry";
import httpStatus from "http-status";
import router from "./routes";
import { returnError } from "./utils/formatter";

const app = express();
const PORT = ENVIRONMENT_VARIABLES.APP.PORT;

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: ENVIRONMENT_VARIABLES.CORS.ORIGIN,
    methods: ENVIRONMENT_VARIABLES.CORS.METHODS,
    credentials: ENVIRONMENT_VARIABLES.CORS.CREDENTIALS,
  })
);
app.use(express.json());
app.use(morgan("combined"));
app.use(compression());
app.use(cookieParser());

app.use(router);

app.get("/health", (req: Request, res: Response) => {
  logger.debug("Health check request");
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT,
  });
});

app.use((req: Request, res: Response) => {
  res
    .status(httpStatus.NOT_FOUND)
    .json(returnError(`Route not found - ${req.originalUrl}`));
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res
    .status(httpStatus.INTERNAL_SERVER_ERROR)
    .json(returnError("Something went wrong"));
});

const server = app.listen(PORT, () => {
  logger.info(
    `Server started on port ${PORT} (${ENVIRONMENT_VARIABLES.APP.ENVIRONMENT})`
  );
});

process.on("SIGTERM", () => {
  logger.warn("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    logger.info("Server closed. Flushing telemetry...");
    await flushTelemetry();
    logger.info("Telemetry flushed. Exiting.");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.warn("SIGINT received. Shutting down gracefully...");
  server.close(async () => {
    logger.info("Server closed. Flushing telemetry...");
    await flushTelemetry();
    logger.info("Telemetry flushed. Exiting.");
    process.exit(0);
  });
});

export default app;
