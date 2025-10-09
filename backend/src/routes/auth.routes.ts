import express from "express";
import passport from "passport";
import { authenticate } from "../middleware/auth";
import * as authController from "../controllers/auth.controller";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", authController.handleLoginWithGoogle);

router.get(
  "/mindx",
  passport.authenticate("openidconnect", {
    scope: ["openid", "profile", "email"],
  })
);

router.get("/callback", authController.handleLoginWithMindX);

router.post("/logout", authenticate, authController.handleLogout);

router.get("/refresh", authController.handleRefreshToken);

export default router;
