import React from "react";
import { paths } from "@/constants";
import { logout } from "@/services/auth";
import { logoutAccount } from "@/store/auth.slice";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { trackEvent, clearAuthenticatedUser } from "@/app-insights";

export default function useLogout() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    trackEvent("auth_logout_attempted", {
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await logout();
      if (response.success) {
        trackEvent("auth_logout_success", {
          timestamp: new Date().toISOString(),
        });

        clearAuthenticatedUser();

        navigate(paths.login);
        dispatch(logoutAccount());
      }
    } catch (error) {
      setError(error as string);

      trackEvent("auth_logout_failed", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, dispatch]);

  return {
    loading,
    error,
    actions: {
      logout: handleLogout,
    },
  };
}
