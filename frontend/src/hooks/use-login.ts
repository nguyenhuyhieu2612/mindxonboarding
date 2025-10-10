import React from "react";
import { API_BASE_URL } from "@/services/api";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "@/store/auth.slice";
import { paths } from "@/constants";
import { trackEvent, setAuthenticatedUser } from "@/app-insights";
import { User } from "@/types/user.types";

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

  const createOAuthLoginHandler = React.useCallback(
    (provider: string) => {
      return async () => {
        setLoading(true);
        setError("");

        trackEvent("auth_login_attempted", {
          provider,
          method: "oauth-popup",
        });

        const popup = window.open(
          `${API_BASE_URL}/auth/${provider}`,
          "_blank",
          "width=500,height=600"
        );

        if (!popup) {
          const errorMsg = "Popup blocked by browser";
          setError(errorMsg);
          setLoading(false);

          trackEvent("auth_login_failed", {
            provider,
            reason: "popup_blocked",
            error: errorMsg,
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
            trackEvent("auth_login_success", {
              provider,
              userId: data.payload.user?.id?.toString() || "unknown",
              userEmail: data.payload.user?.email || "unknown",
            });

            if (data.payload.user?.id) {
              setAuthenticatedUser(
                data.payload.user.id.toString(),
                data.payload.user.email
              );
            }

            dispatch(setCredentials(data.payload));
            navigate(paths.home);
          } else if (data.type === "OAUTH_ERROR") {
            const errorMsg = data.error || "Authentication failed";
            setError(errorMsg);

            trackEvent("auth_login_failed", {
              provider,
              reason: "oauth_error",
              error: errorMsg,
            });
          }

          cleanup();
        };

        const checkPopupClosed = setInterval(() => {
          if (popup.closed) {
            const errorMsg = "Popup closed by user";
            setError(errorMsg);

            trackEvent("auth_login_failed", {
              provider,
              reason: "popup_closed",
              error: errorMsg,
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
