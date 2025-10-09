import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { logger, returnError } from "./utils";
import httpStatus from "http-status";
import router from "./routes";
import config from "./config/config";
import session from "express-session";

const app = express();
const corsOptions = {
  origin: config.CORS_ORIGIN,
  methods: config.CORS_METHODS,
  credentials: config.CORS_CREDENTIALS,
};
const sessionOptions = {
  secret: config.ACCESS_TOKEN_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("combined"));
app.use(compression());
app.use(cookieParser());
app.use(session(sessionOptions));
app.use(router);

app.get("/health", (req: Request, res: Response) => {
  logger.debug("Health check request");
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
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

export default app;
