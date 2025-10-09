import passport from "passport";
import {
  Strategy as OpenIDConnectStrategy,
  Profile,
  VerifyCallback,
} from "passport-openidconnect";
import { config } from "../config";

passport.use(
  new OpenIDConnectStrategy(
    {
      issuer: config.MINDX_ISSUER,
      authorizationURL: config.MINDX_AUTH_URL,
      tokenURL: config.MINDX_TOKEN_URL,
      userInfoURL: config.MINDX_USERINFO_URL,
      clientID: config.MINDX_CLIENT_ID,
      clientSecret: config.MINDX_CLIENT_SECRET,
      callbackURL: config.MINDX_REDIRECT_URI,
      scope: config.MINDX_SCOPE,
    },
    (
      issuer: string,
      profile: Profile,
      context: object,
      idToken: string | object,
      accessToken: string | object,
      refreshToken: string,
      done: VerifyCallback
    ) => {
      try {
        done(null, profile);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);
