import React from "react";
import { apiClient } from "@services/api";

export default function useApiHealth() {
  const [isHealthy, setIsHealthy] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkHealth = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsHealthy(null);
    try {
      const health = await apiClient.getHealth();
      setIsHealthy(health.status === "healthy");
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
      window.alert("API is healthy");
    }
  }, [isHealthy]);

  return { isHealthy, loading, error, checkHealth, actions: { checkHealth } };
}
