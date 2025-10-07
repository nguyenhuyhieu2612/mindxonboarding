import { Router, Response } from "express";
import { handleAsyncError } from "../utils/async";
import HTTP_STATUS from "http-status";
import { returnSuccess } from "../utils/formatter";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get(
  "/me",
  authenticate,
  handleAsyncError(async (req: any, res: Response) => {
    return res
      .status(HTTP_STATUS.OK)
      .json(returnSuccess("User profile retrieved successfully", req.user));
  })
);

export default router;
