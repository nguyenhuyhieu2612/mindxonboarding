import React from "react";
import { paths } from "@/constants";
import { logout } from "@/services/auth";
import { logoutAccount } from "@/store/auth.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { useGA4 } from "./use-ga4";
import { useAI } from "./use-ai";

export default function useLogout() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { setUser, setUserProperties, trackEvent: trackGA4Event } = useGA4();
  const {
    trackEvent: trackAIEvent,
    trackException: trackAIException,
    clearAuthenticatedUser: clearAIAuthenticatedUser,
  } = useAI();

  const handleLogout = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await logout();

      if (response?.success) {
        trackAIEvent("UserLogout", {
          UserId: user!.id.toString(),
          Method: "manual",
          Page: "Logout",
          Feature: "Auth",
        });
        trackGA4Event("logout", {
          method: "manual",
        });
        setUser(null);
        setUserProperties({
          user_role: "guest",
          plan_type: "free",
          language_preference: "vi",
        });

        clearAIAuthenticatedUser();
        dispatch(logoutAccount());

        navigate(paths.login);
      } else {
        throw new Error("Logout response was not successful");
      }
    } catch (err) {
      setError(err as string);

      trackAIException(new Error(err as string), {
        Method: "manual",
        Page: "Logout",
        Feature: "Auth",
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
