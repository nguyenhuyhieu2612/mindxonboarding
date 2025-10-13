import { NextFunction, Request, Response } from "express";
import { ApiError, returnError } from "../utils";
import { config } from "../config";

export const handleError = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong";
  return res
    .status(statusCode)
    .json(
      returnError(message, config.NODE_ENV === "production" ? null : error)
    );
};

export const handleNotFound = (req: Request, res: Response) => {
  res.status(404).json(returnError(`Route not found - ${req.originalUrl}`));
};
