import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { returnError } from "./formatter";
import { logger } from "./logger";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const handleAsyncError = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: unknown) => {
      logger.error("Unhandled async error:", err);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(returnError("Something went wrong"));
    });
  };
};
