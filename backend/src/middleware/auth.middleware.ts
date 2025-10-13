import httpStatus from "http-status";
import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.services";
import { logger, handleAsyncError, ApiError } from "../utils";
import { prisma } from "../config/prisma-client";

export const authenticate = handleAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const headerAuth = req.headers.authorization;
    if (!headerAuth || !headerAuth.startsWith("Bearer ")) {
      throw new ApiError(
        "Please log in to access this resource",
        httpStatus.UNAUTHORIZED
      );
    }
    const token = headerAuth.split(" ")[1];
    if (!token) {
      throw new ApiError(
        "Please log in to access this resource",
        httpStatus.UNAUTHORIZED
      );
    }
    logger.debug("4");
    const decoded = await tokenService.verifyAccessToken(token);
    const { userId = null } = decoded;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError("User not found", httpStatus.NOT_FOUND);
    }

    req.user = user;
    next();
  }
);
