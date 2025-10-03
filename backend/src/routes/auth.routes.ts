import { Router, Request, Response } from "express";
import { authService } from "../services/auth.services";
import { tokenService } from "../services/token.services";
import { APP_CONFIG } from "../config/config";
import { HTTP_STATUS } from "../config/contants";
import { handleAsyncError } from "../utils/async";

const router = Router();

router.get(
  "/login",
  handleAsyncError(async (req: Request, res: Response) => {
    const state = Math.random().toString(36).substring(7);
    const authURL = authService.getAuthorizationURL(state);

    const session = (req as any).session;
    if (session) {
      session.authState = state;
    }
    return res.redirect(HTTP_STATUS.OK, authURL);
  })
);

router.get(
  "/callback",
  handleAsyncError(async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code || typeof code != "string") {
      throw new Error("No code provided");
    }

    if (req.session && (req.session as any).authState) {
      const sessionState = (req.session as any).authState;
      if (state !== sessionState) {
        throw new Error("Invalid state");
      }

      delete (req.session as any).authState;
    }
    const tokens = await authService.exchangeCodeForTokens(code);
    const userInfo = await authService.getUserInfo(tokens.access_token);
    const { accessToken, refreshToken } =
      tokenService.generateAccessTokenAndRefreshToken(userInfo.sub);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: APP_CONFIG.app.environment === "production",
      sameSite: "lax",
      maxAge: APP_CONFIG.session.refreshTokenExpiresIn * 1000,
    });

    res.send(`<!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .success-box {
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 16px;
              backdrop-filter: blur(10px);
            }
          </style>
        </head>
        <body>
          <div class="success-box">
            <h2>✅ Login Successful!</h2>
            <p>Taking you back to the app...</p>
          </div>
          <script>
            // Gửi tokens về main app
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              payload: {
                accessToken: "${accessToken}",
                user: ${JSON.stringify(userInfo)}
              }
            }, '${APP_CONFIG.cors.frontendURL}');
            
            // Đóng popup sau 1 giây
            setTimeout(() => window.close(), 1000);
          </script>
        </body>
      </html>`);
  })
);

export default router;
