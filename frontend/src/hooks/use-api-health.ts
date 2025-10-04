import React from "react";
import { getHealth } from "@services/auth";

export default function useApiHealth() {
  const [isHealthy, setIsHealthy] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkHealth = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsHealthy(null);
    try {
      const response = await getHealth();
      setIsHealthy(response.data?.status === "healthy");
    } catch (err) {
      setError(err as string);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkHealth();
  }, []);

  React.useEffect(() => {
    if (isHealthy === true) {
      console.log("API is healthy");
    }
  }, [isHealthy]);

  return { isHealthy, loading, error, checkHealth, actions: { checkHealth } };
}
