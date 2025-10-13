import React from "react";
import {
  setGA4User,
  setGA4UserProperties,
  trackGA4Error,
  trackGA4Event,
  trackGA4ViewPage,
} from "@/lib/analytics";

export const useGA4 = () => {
  const trackViewPage = React.useCallback(trackGA4ViewPage, []);
  const trackEvent = React.useCallback(trackGA4Event, []);
  const trackErrorEvent = React.useCallback(trackGA4Error, []);
  const setUser = React.useCallback(setGA4User, []);
  const setUserProperties = React.useCallback(setGA4UserProperties, []);

  return {
    trackEvent,
    trackErrorEvent,
    setUserProperties,
    trackViewPage,
    setUser,
  };
};
