import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { telemetryService } from "../services";
import { ApiError } from "../utils";
import { config } from "../config";

export const addCorrelationId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    uuidv4();

  res.setHeader("X-Correlation-ID", correlationId);

  (req as any).correlationId = correlationId;

  next();
};

export const errorLoggingMiddleware = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.id;

  telemetryService.trackError(err, {
    Method: req.method,
    Endpoint: req.path,
    Url: req.originalUrl,
    CorrelationId: (req as any).correlationId,
    StatusCode: err.statusCode,
    UserId: userId,
    Feature: "Checkout",
    RequestBody: JSON.stringify(req.body),
    Environment: config.NODE_ENV,
  });

  next(err);
};
