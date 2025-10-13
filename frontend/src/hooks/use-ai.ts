import {
  clearAIAuthenticatedUser,
  setAIAuthenticatedUser,
  trackAIEvent,
  trackAIException,
  trackAIMetric,
} from "@/app-insights";
import React from "react";

export const useAI = () => {
  const trackEvent = React.useCallback(trackAIEvent, []);
  const trackException = React.useCallback(trackAIException, []);
  const trackMetric = React.useCallback(trackAIMetric, []);
  const setAuthenticatedUser = React.useCallback(setAIAuthenticatedUser, []);
  const clearAuthenticatedUser = React.useCallback(
    clearAIAuthenticatedUser,
    []
  );

  return {
    trackEvent,
    trackException,
    trackMetric,
    setAuthenticatedUser,
    clearAuthenticatedUser,
  };
};
