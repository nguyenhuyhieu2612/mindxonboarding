import { Router, Request, Response } from "express";
import { authService } from "../services/auth.services";
import { tokenService } from "../services/token.services";
import { ENVIRONMENT_VARIABLES } from "../config/environment-variables";
import { handleAsyncError } from "../utils/async";
import { logger } from "../utils/logger";
import { authenticate, AuthRequest } from "../middleware/auth";
import { returnError, returnSuccess } from "../utils/formatter";
import { trackEvent, trackMetric } from "../utils/telemetry";
import HTTP_STATUS from "http-status";

const router = Router();

router.get(
  "/mindx",
  handleAsyncError(async (req: Request, res: Response) => {
    const state = Math.random().toString(36).substring(7);
    const authURL = authService.getAuthorizationURL(state);

    const session = (req as any).session;
    if (session) {
      session.authState = state;
    }
    return res.redirect(authURL);
  })
);

router.get(
  "/callback",
  handleAsyncError(async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        logger.error("OAuth provider returned error", {
          error,
          description: error_description,
        });

        const oauthError = {
          type: "OAUTH_ERROR",
          error:
            (error_description as string) ||
            (error as string) ||
            "Authentication failed",
        };

        const encodedError = encodeURIComponent(JSON.stringify(oauthError));
        return res.redirect(
          `${ENVIRONMENT_VARIABLES.FRONTEND_URL}#oauth_result=${encodedError}`
        );
      }

      if (!code || typeof code !== "string") {
        logger.error("OAuth callback missing code parameter");

        const oauthError = {
          type: "OAUTH_ERROR",
          error: "Missing authorization code",
        };

        const encodedError = encodeURIComponent(JSON.stringify(oauthError));
        return res.redirect(
          `${ENVIRONMENT_VARIABLES.FRONTEND_URL}#oauth_result=${encodedError}`
        );
      }

      if (req.session && (req.session as any).authState) {
        const sessionState = (req.session as any).authState;
        if (state !== sessionState) {
          logger.error("OAuth state mismatch - possible CSRF attack", {
            expected: sessionState,
            received: state,
          });

          const oauthError = {
            type: "OAUTH_ERROR",
            error: "Invalid state parameter - possible CSRF attack",
          };

          const encodedError = encodeURIComponent(JSON.stringify(oauthError));
          return res.redirect(
            `${ENVIRONMENT_VARIABLES.FRONTEND_URL}#oauth_result=${encodedError}`
          );
        }
        delete (req.session as any).authState;
      }

      const tokens = await authService.exchangeCodeForTokens(code);

      const userInfo = await authService.decodeIDToken(tokens.id_token);

      const { accessToken, refreshToken } =
        await tokenService.generateAccessTokenAndRefreshToken(userInfo.userId);

      const cookieOptions = {
        httpOnly: true,
        secure: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: ENVIRONMENT_VARIABLES.SESSION.REFRESH_TOKEN.EXPIRES_IN * 1000,
      };

      res.cookie("refreshToken", refreshToken, cookieOptions);

      logger.info("User authenticated successfully", {
        userId: userInfo.userId,
        isTemporary: userInfo._isTemporary || false,
      });

      trackEvent("user-login", {
        userId: userInfo.userId,
        loginMethod: "mindx-oauth",
        environment: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT,
      });

      trackMetric("active-user-logins", 1, {
        loginMethod: "mindx-oauth",
      });

      const oauthResult = {
        type: "OAUTH_SUCCESS",
        payload: {
          accessToken,
          user: userInfo,
        },
      };

      const encodedResult = encodeURIComponent(JSON.stringify(oauthResult));
      const redirectUrl = `${ENVIRONMENT_VARIABLES.FRONTEND_URL}/login/#oauth_result=${encodedResult}`;

      logger.info("Redirecting user to frontend", {
        frontendUrl: ENVIRONMENT_VARIABLES.FRONTEND_URL,
      });

      res.redirect(redirectUrl);
    } catch (error: any) {
      logger.error("❌ Error in OAuth callback", {
        error: error.message,
        stack: error.stack,
      });

      const oauthError = {
        type: "OAUTH_ERROR",
        error: error.message || "Authentication failed",
      };

      const encodedError = encodeURIComponent(JSON.stringify(oauthError));
      res.redirect(
        `${ENVIRONMENT_VARIABLES.FRONTEND_URL}#oauth_result=${encodedError}`
      );
    }
  })
);

router.post(
  "/logout",
  authenticate,
  handleAsyncError(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.cookies;

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT === "production",
      sameSite: "lax",
      path: "/",
    });

    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }

    trackEvent("user-logout", {
      userId: req.user?.userId || "unknown",
      environment: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT,
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(returnSuccess("Logout successful.", null));
  })
);

router.post(
  "/refresh-token",
  handleAsyncError(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(returnError("Refresh token is missing."));
    }

    try {
      const { userId } = await tokenService.verifyRefreshToken(refreshToken);
      const accessToken = tokenService.generateAccessToken({ userId });

      return res
        .status(HTTP_STATUS.OK)
        .json(returnSuccess("Token refreshed.", accessToken));
    } catch (err) {
      logger.error("Refresh token verification failed", { error: err });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT === "production",
        sameSite: "lax",
        path: "/",
      });

      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(returnError("Invalid or expired refresh token."));
    }
  })
);

export default router;
