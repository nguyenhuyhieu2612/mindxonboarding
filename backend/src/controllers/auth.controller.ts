import passport from "passport";
import httpStatus from "http-status";
import { prisma, config } from "../config";
import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.services";
import {
  handleAsyncError,
  returnError,
  returnSuccess,
  trackEvent,
  trackMetric,
} from "../utils";

export const handleLoginWithGoogle = handleAsyncError(
  async (req, res, next) => {
    passport.authenticate(
      "google",
      { session: false },
      async (err, user, info) => {
        if (err || !user) {
          return res
            .status(httpStatus.UNAUTHORIZED)
            .json(returnError("Google authentication failed."));
        }

        let userIns = await prisma.user.findUnique({
          where: {
            email: user.emails[0].value,
            googleId: user.id,
          },
        });

        if (!userIns) {
          userIns = await prisma.user.create({
            data: {
              email: user.emails[0].value,
              name: user.displayName,
              googleId: user.id,
              avatar: user.photos[0].value,
            },
          });
        }

        const { accessToken, refreshToken } =
          await tokenService.generateAccessTokenAndRefreshToken(userIns.id);

        setRefreshTokenCookie(res, refreshToken);

        const oauthResult = {
          type: "OAUTH_SUCCESS",
          payload: {
            accessToken,
            user: userIns,
          },
        };

        trackEvent("user-login", {
          id: userIns.id.toString(),
          name: userIns.name,
          email: userIns.email,
          loginMethod: "google-oauth",
          environment: config.NODE_ENV,
        });

        trackMetric("user-active", 1, {
          loginMethod: "google-oauth",
          environment: config.NODE_ENV,
        });

        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");

        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Complete</title>
          </head>
          <body>
            <p>Authentication successful! Closing window...</p>
            <script>
              console.log("🔵 OAuth callback started");
              
              const oauthResult = ${JSON.stringify(oauthResult)};

              function sendMessage() {
                try {
                  if (window.opener && !window.opener.closed) {
                    const targetOrigin = "${config.FRONTEND_URL}";
                    window.opener.postMessage(oauthResult, targetOrigin);          
                    setTimeout(() => {
                      window.close();
                    }, 500);
                  } else {
                    console.error("🚫 No window.opener or opener is closed");
                  }
                } catch (error) {
                  console.error("💥 Error in postMessage:", error);
                }
              }
              sendMessage();

            </script>
          </body>
          </html>
`);
      }
    )(req, res, next);
  }
);

export const handleLoginWithMindX = handleAsyncError(async (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      if (err || !user) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json(returnError("Google authentication failed."));
      }
    }
  )(req, res, next);
});

export const handleLogout = handleAsyncError(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }

    trackEvent("user-logout", {
      id: (req.user as any).id.toString(),
      name: (req.user as any).name,
      email: (req.user as any).email,
      environment: config.NODE_ENV,
    });

    return res
      .status(httpStatus.OK)
      .json(returnSuccess("Logout successful.", null));
  }
);

export const handleRefreshToken = handleAsyncError(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(returnError("Refresh token is missing."));
    }

    try {
      const { userId } = await tokenService.verifyRefreshToken(refreshToken);
      const accessToken = tokenService.generateAccessToken({ userId });

      return res
        .status(httpStatus.OK)
        .json(returnSuccess("Token refreshed.", accessToken));
    } catch (err) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(returnError("Invalid or expired refresh token."));
    }
  }
);

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax" as "lax",
    path: "/",
    maxAge: config.REFRESH_TOKEN_EXPIRES_IN * 1000,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);
};
