import passport from "passport";
import httpStatus from "http-status";
import { prisma, config } from "../config";
import { Request, Response, NextFunction } from "express";
import { tokenService, telemetryService } from "../services";
import { ApiError, handleAsyncError, returnSuccess } from "../utils";

export const handleLoginWithGoogle = handleAsyncError(
  async (req, res, next) => {
    passport.authenticate(
      "google",
      { session: false },
      async (err, user, info) => {
        if (err || !user) {
          throw new ApiError(
            "Google authentication failed.",
            httpStatus.UNAUTHORIZED
          );
        }

        let userIns = await prisma.user.findUnique({
          where: { googleId: user.id },
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

        telemetryService.trackEvent("UserLogin", {
          UserId: userIns.id.toString(),
          Method: "google",
          Feature: "Auth",
          Success: "true",
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
        throw new ApiError(
          "MindX authentication failed.",
          httpStatus.UNAUTHORIZED
        );
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
      telemetryService.trackEvent("UserLogout", {
        UserId: (req.user as any).id.toString(),
        Method: "manual",
        Feature: "Auth",
        Success: "true",
      });
    }

    return res
      .status(httpStatus.OK)
      .json(returnSuccess("Logout successful.", null));
  }
);

export const handleRefreshToken = handleAsyncError(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new ApiError("Refresh token not found.", httpStatus.UNAUTHORIZED);
    }

    try {
      const { userId } = await tokenService.verifyRefreshToken(refreshToken);
      const accessToken = tokenService.generateAccessToken({ userId });
      telemetryService.trackEvent("RefreshToken", {
        UserId: userId.toString(),
        Feature: "Auth",
        Success: "true",
      });
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
      telemetryService.trackEvent("RefreshToken", {
        UserId: "unknow",
        Feature: "Auth",
        Success: "false",
      });

      throw new ApiError("Invalid refresh token.", httpStatus.UNAUTHORIZED);
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
