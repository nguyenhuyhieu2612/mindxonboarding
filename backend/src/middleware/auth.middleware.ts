import httpStatus from "http-status";
import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.services";
import { logger, handleAsyncError, ApiError } from "../utils";
import { prisma } from "../config/prisma-client";

export const authenticate = handleAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get authorization header
    const headerAuth = req.headers.authorization;

    if (!headerAuth || !headerAuth.startsWith("Bearer ")) {
      throw new ApiError(
        "Please log in to access this resource",
        httpStatus.UNAUTHORIZED
      );
    }

    // Extract token
    const token = headerAuth.split(" ")[1];
    if (!token) {
      throw new ApiError(
        "Please log in to access this resource",
        httpStatus.UNAUTHORIZED
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = await tokenService.verifyAccessToken(token);
    } catch (error) {
      // JWT verification failed - return 401, not 500
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new ApiError("Invalid or expired token", httpStatus.UNAUTHORIZED);
    }

    if (!decoded || !decoded.userId) {
      logger.error("Invalid token or missing userId", { decoded });
      throw new ApiError("Invalid token", httpStatus.UNAUTHORIZED);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      logger.error("User not found", { userId: decoded.userId });
      throw new ApiError("User not found", httpStatus.NOT_FOUND);
    }

    // Attach user to request
    req.user = user;

    // IMPORTANT: Call next() to continue to next middleware/controller
    next(); // ← MUST CALL THIS!
  }
);
