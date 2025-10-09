import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.services";
import httpStatus from "http-status";
import { returnError } from "../utils/formatter";
import { prisma } from "../config/prisma-client";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const headerAuth = req.headers.authorization;

  if (!headerAuth || !headerAuth.startsWith("Bearer ")) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json(returnError("Please log in to access this resource"));
  }

  const token = headerAuth.split(" ")[1];

  if (!token) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json(returnError("Please log in to access this resource"));
  }

  const decoded = await tokenService.verifyAccessToken(token);
  const { userId = null } = decoded;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json(returnError("User does not exist"));
  }

  req.user = user;
  next();
};
