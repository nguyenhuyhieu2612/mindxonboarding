import React from "react";
import { paths } from "@/constants";
import { logout } from "@/services/auth";
import { logoutAccount } from "@/store/auth.slice";
import { useAppDispatch } from "@/store/hooks";
import { useNavigate } from "react-router-dom";

export default function useLogout() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await logout();
      if (response.success) {
        navigate(paths.login);
        dispatch(logoutAccount());
      }
    } catch (error) {
      setError(error as string);
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
