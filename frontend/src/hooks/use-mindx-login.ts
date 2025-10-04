import React from "react";
import { API_BASE_URL } from "@/services/api";
import { setCredentials } from "@/store/auth.slice";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { paths } from "@/constants";

export default function useMindXLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleMindXLogin = React.useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem("oauth_return_url", returnUrl);

      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem("oauth_state", state);

      console.log("Initiating OAuth redirect flow with state:", state);

      window.location.href = `${API_BASE_URL}/auth/mindx`;
    } catch (error) {
      console.error("Error initiating login:", error);
      setLoading(false);
      setError("Failed to initiate authentication");
      sessionStorage.removeItem("oauth_state");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const checkOAuthCallback = () => {
      const hash = window.location.hash;
      if (!hash.includes("oauth_result")) return;

      try {
        console.log("Detected OAuth callback in URL");

        const params = new URLSearchParams(hash.substring(1));
        const resultStr = params.get("oauth_result");

        if (!resultStr) return;

        const result = JSON.parse(decodeURIComponent(resultStr));

        if (result.type === "OAUTH_SUCCESS") {
          console.log("OAuth authentication successful", result);

          if (result.payload.accessToken) {
            dispatch(
              setCredentials({
                accessToken: result.payload.accessToken,
                user: result.payload.user,
              })
            );
            navigate(paths.home);
          }
        } else if (result.type === "OAUTH_ERROR") {
          console.error("OAuth authentication failed:", result.error);
          setError(result.error || "Authentication failed");
        }

        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );

        setLoading(false);

        sessionStorage.removeItem("oauth_state");
      } catch (err) {
        console.error("Error parsing OAuth callback:", err);
        setError("Failed to process authentication response");
        sessionStorage.removeItem("oauth_state");
      }
    };

    const oauthState = sessionStorage.getItem("oauth_state");
    if (oauthState) {
      console.log("OAuth flow in progress, checking for callback...");
      setLoading(true);
      checkOAuthCallback();
    } else {
      checkOAuthCallback();
    }
  }, [dispatch]);

  return {
    loading,
    error,
    actions: {
      handleMindXLogin,
    },
  };
}
