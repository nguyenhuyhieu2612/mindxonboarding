import React from "react";
import { useLocation } from "react-router-dom";
import { trackGA4ViewPage } from "@/lib/analytics";

export const useGA4PageTracking = () => {
  const location = useLocation();

  React.useEffect(() => {
    const pagePath = location.pathname + location.search;
    trackGA4ViewPage(pagePath);
  }, [location]);
};
