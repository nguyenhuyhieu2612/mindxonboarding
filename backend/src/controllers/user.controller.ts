import httpStatus from "http-status";
import { Request, Response } from "express";
import { returnSuccess, handleAsyncError } from "../utils";

export const handleGetCurrentUser = handleAsyncError(async (req, res) => {
  const user = req.user;
  return res
    .status(httpStatus.OK)
    .json(returnSuccess("User profile retrieved successfully", user));
});
