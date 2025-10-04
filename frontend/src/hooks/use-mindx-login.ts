import React from "react";
import { API_BASE_URL } from "@/services/api";

export default function useMindXLogin() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

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
          console.log("OAuth authentication successful");
          setData(result.payload);

          if (result.payload.accessToken) {
            localStorage.setItem("accessToken", result.payload.accessToken);
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

        setIsLoading(false);

        sessionStorage.removeItem("oauth_state");
      } catch (err) {
        console.error("Error parsing OAuth callback:", err);
        setError("Failed to process authentication response");
        setIsLoading(false);
        sessionStorage.removeItem("oauth_state");
      }
    };

    const oauthState = sessionStorage.getItem("oauth_state");
    if (oauthState) {
      console.log("OAuth flow in progress, checking for callback...");
      setIsLoading(true);
      checkOAuthCallback();
    } else {
      checkOAuthCallback();
    }
  }, []);

  const handleLogin = React.useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      const returnUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem("oauth_return_url", returnUrl);

      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem("oauth_state", state);

      console.log("Initiating OAuth redirect flow with state:", state);

      window.location.href = `${API_BASE_URL}/auth/mindx`;
    } catch (err) {
      console.error("Error initiating login:", err);
      setIsLoading(false);
      setError("Failed to initiate authentication");
      sessionStorage.removeItem("oauth_state");
    }
  }, []);

  return { isLoading, error, data, actions: { handleLogin } };
}
