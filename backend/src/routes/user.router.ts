import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as userController from "../controllers/user.controller";

const router = Router();

router.get("/me", authenticate, userController.handleGetCurrentUser);

export default router;
