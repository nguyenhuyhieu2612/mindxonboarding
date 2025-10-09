import httpStatus from "http-status";
import { Request, Response } from "express";
import { returnSuccess } from "../utils/formatter";
import { handleAsyncError } from "../utils/async";

export const handleGetCurrentUser = handleAsyncError(async (req, res) => {
  const user = req.user;
  return res
    .status(httpStatus.OK)
    .json(returnSuccess("User profile retrieved successfully", user));
});
