import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.services";
import HTTP_STATUS from "http-status";
import { returnError } from "../utils/formatter";

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const headerAuth = req.headers.authorization;

  if (!headerAuth || !headerAuth.startsWith("Bearer ")) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(returnError("Please log in to access this resource"));
  }

  const token = headerAuth.split(" ")[1];

  if (!token) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(returnError("Please log in to access this resource"));
  }

  const decoded = await tokenService.verifyAccessToken(token);

  if (!decoded) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(returnError("User does not exist"));
  }

  req.user = { userId: decoded.userId };
  next();
};
