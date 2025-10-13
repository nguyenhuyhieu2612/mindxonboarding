import cors from "cors";
import morgan from "morgan";
import router from "./routes";
import { logger } from "./utils";
import { config } from "./config";
import compression from "compression";
import session from "express-session";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { handleError, handleNotFound } from "./controllers";
import { addCorrelationId, errorLoggingMiddleware } from "./middleware";

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

app.use(addCorrelationId);

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

app.use(handleNotFound);
app.use(errorLoggingMiddleware);
app.use(handleError);

export default app;
