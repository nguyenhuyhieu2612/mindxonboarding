import React from "react";
import { paths } from "@/constants";
import { logout } from "@/services/auth";
import { logoutAccount } from "@/store/auth.slice";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { AppInsights } from "@/app-insights";

const appInsights = AppInsights.init();

export default function useLogout() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    appInsights.trackEvent("Auth_Logout_Attempted", {
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await logout();
      if (response.success) {
        navigate(paths.login);
        dispatch(logoutAccount());
        appInsights.trackEvent("Auth_Logout_Succeeded", {
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      setError(error as string);
      appInsights.trackException(
        error instanceof Error ? error : new Error(String(error)),
        {
          action: "logout",
        }
      );

      appInsights.trackEvent("Auth_Logout_Failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    actions: {
      logout: handleLogout,
    },
  };
}
