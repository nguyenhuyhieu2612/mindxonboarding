import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/auth.slice";
import { getCurrentUser } from "@/services/user";
import { paths } from "@/constants";
import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  const handleGetCurrentUser = React.useCallback(async () => {
    if (user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getCurrentUser();
      if (response.success) {
        dispatch(setUser(response.data));
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setLoading(false);
    }
  }, [dispatch, user]);

  React.useEffect(() => {
    handleGetCurrentUser();
  }, [handleGetCurrentUser]);

  if (loading) return <p>Loading...</p>;
  if (error) {
    return <Navigate to={paths.login} />;
  }

  return <Outlet />;
}
