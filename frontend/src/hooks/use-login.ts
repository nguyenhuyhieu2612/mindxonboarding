import React from "react";
import { API_BASE_URL } from "@/services/api";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "@/store/auth.slice";
import { paths } from "@/constants";

type OAuthSuccessPayload = {
  accessToken: string;
  user: any; // Thay bằng User type của bạn nếu có
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

        const popup = window.open(
          `${API_BASE_URL}/auth/${provider}`,
          "_blank",
          "width=500,height=600"
        );

        if (!popup) {
          setError("Popup blocked by browser");
          setLoading(false);
          return;
        }

        const handleMessage = (event: MessageEvent<OAuthMessage>) => {
          console.log("🎯 handleMessage TRIGGERED", { 
            origin: event.origin, 
            data: event.data,
            type: typeof event.data,
            dataType: event.data?.type
          });
          
          // Kiểm tra origin - accept cả relative path và full URL
          const expectedOrigin = API_BASE_URL.startsWith('http') 
            ? API_BASE_URL 
            : window.location.origin;
          
          console.log("🔍 Origin check:", { 
            received: event.origin, 
            expected: expectedOrigin,
            match: event.origin === expectedOrigin
          });
          
          if (event.origin !== expectedOrigin) {
            console.log("❌ Origin mismatch - IGNORED");
            return;
          }

          const data = event.data;
          console.log("✅ OAuth data ACCEPTED:", data);
          if (data.type === "OAUTH_SUCCESS" && data.payload) {
            dispatch(setCredentials(data.payload));
            navigate(paths.home);
          } else if (data.type === "OAUTH_ERROR") {
            setError(data.error || "Authentication failed");
          }

          cleanup();
        };

        const checkPopupClosed = setInterval(() => {
          if (popup.closed) {
            setError("Popup closed by user");
            cleanup();
          }
        }, 500);

        const cleanup = () => {
          setLoading(false);
          window.removeEventListener("message", handleMessage);
          clearInterval(checkPopupClosed);
          popup.close();
        };

        console.log("📡 Registering message event listener...");
        window.addEventListener("message", handleMessage);
        console.log("✅ Message listener registered, waiting for messages...");
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
