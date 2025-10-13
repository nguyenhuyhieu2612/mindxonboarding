import React from "react";
import { API_BASE_URL } from "@/services/api";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "@/store/auth.slice";
import { paths } from "@/constants";
import { User } from "@/types/user.types";
import { useGA4 } from "./use-ga4";
import { setGA4User } from "@/lib/analytics";
import { useAI } from "./use-ai";

type OAuthSuccessPayload = {
  accessToken: string;
  user: User;
};

type OAuthMessage = {
  type: "OAUTH_SUCCESS" | "OAUTH_ERROR";
  payload?: OAuthSuccessPayload;
  error?: string;
};

export default function useLogin() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { setUserProperties, setUser, trackEvent: trackGA4Event } = useGA4();
  const {
    trackEvent: trackAIEvent,
    trackException: trackAIException,
    setAuthenticatedUser: setAIAuthenticatedUser,
    clearAuthenticatedUser: clearAIAuthenticatedUser,
  } = useAI();

  const createOAuthLoginHandler = React.useCallback(
    (provider: string) => {
      return async () => {
        setLoading(true);
        setError("");

        const popup = window.open(
          `${API_BASE_URL}/auth/${provider}`,
          "_blank",
          "width=500,height=600"
        );

        if (!popup) {
          const errorMsg = "Popup blocked by browser";
          setError(errorMsg);
          setLoading(false);

          trackAIException(new Error(errorMsg), {
            Method: provider,
            Page: "Login",
            Feature: "OAuth",
          });

          return;
        }

        const handleMessage = (event: MessageEvent<OAuthMessage>) => {
          const expectedOrigin = API_BASE_URL.startsWith("http")
            ? API_BASE_URL
            : window.location.origin;

          if (event.origin !== expectedOrigin) return;

          const data = event.data;

          if (data.type === "OAUTH_SUCCESS" && data.payload) {
            const { user } = data.payload;

            trackAIEvent("UserLogin", {
              UserId: user.id.toString(),
              Method: provider,
              Page: "Login",
              Feature: "OAuth",
            });
            setAIAuthenticatedUser(user.id.toString());
            trackGA4Event("login", {
              method: provider,
            });
            setUser(user.id.toString());
            setUserProperties({
              user_role: "student",
              plan_type: "free",
              language_preference: "vi",
            });

            dispatch(setCredentials(data.payload));
            navigate(paths.home);
          } else if (data.type === "OAUTH_ERROR") {
            const errorMsg = data.error || "Authentication failed";
            setError(errorMsg);

            trackAIException(new Error(errorMsg), {
              Method: provider,
              Page: "Login",
              Feature: "OAuth",
            });
            clearAIAuthenticatedUser();
            setGA4User(null);
            setUserProperties({
              user_role: "guest",
              plan_type: "free",
              language_preference: "vi",
            });
          }

          cleanup();
        };

        const checkPopupClosed = setInterval(() => {
          if (popup.closed) {
            const errorMsg = "Popup closed by user";
            setError(errorMsg);

            trackAIException(new Error(errorMsg), {
              Method: provider,
              Page: "Login",
              Feature: "OAuth",
            });

            cleanup();
          }
        }, 500);

        const cleanup = () => {
          setLoading(false);
          window.removeEventListener("message", handleMessage);
          clearInterval(checkPopupClosed);
          popup.close();
        };

        window.addEventListener("message", handleMessage);
      };
    },
    [dispatch, navigate]
  );

  return {
    loading,
    error,
    actions: {
      handleLoginWithGoogle: createOAuthLoginHandler("google"),
      handleLoginWithMindX: createOAuthLoginHandler("mindx"),
    },
  };
}
