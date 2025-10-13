import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/auth.slice";
import { getCurrentUser } from "@/services/user";
import { paths } from "@/constants";
import { Navigate, Outlet } from "react-router-dom";
import { useGA4 } from "@/hooks/use-ga4";

export default function PrivateRoute() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { setUser: setGA4User, setUserProperties } = useGA4();

  const handleGetCurrentUser = React.useCallback(async () => {
    if (user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getCurrentUser();
      if (response.success) {
        setGA4User(response.data!.id.toString());
        setUserProperties({
          user_role: "student",
          plan_type: "free",
          language_preference: "vi",
        });
        dispatch(setUser(response.data));
      }
    } catch (error) {
      setError(error as string);
      setGA4User(null);
      setUserProperties({
        user_role: "guest",
        plan_type: "free",
        language_preference: "vi",
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, user, setGA4User, setUserProperties]);

  React.useEffect(() => {
    handleGetCurrentUser();
  }, [handleGetCurrentUser]);

  if (loading) return <p>Loading...</p>;
  if (error) {
    return <Navigate to={paths.login} replace />;
  }

  return <Outlet />;
}
