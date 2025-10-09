import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import config from "../config";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_REDIRECT_URI,
      scope: config.GOOGLE_SCOPE,
    },
    (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        // success
        done(null, profile);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);
