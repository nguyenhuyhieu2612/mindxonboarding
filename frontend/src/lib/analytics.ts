import ReactGA from "react-ga4";

const ga4MeasurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let isGA4Initialized = false;

export const initializeGA4 = (): void => {
  if (!ga4MeasurementId) {
    console.warn("⚠️ GA4 measurement ID not found in environment variables");
    return;
  }

  if (isGA4Initialized) {
    console.log("GA4 already initialized");
    return;
  }

  try {
    ReactGA.initialize(ga4MeasurementId, {
      gaOptions: {
        debug_mode: import.meta.env.DEV
      }
    });
    isGA4Initialized = true;
    console.log("✅ GA4 initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing GA4:", error);
  }
};

export const trackGA4PageTiming = (path: string): void => {
  if (typeof window === "undefined" && !isGA4Initialized) {
    console.warn("⚠️ GA4 not initialized yet, cannot track page timing");
    return;
  }

  const [navEntry] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];
  const paintEntries = performance.getEntriesByType(
    "paint"
  ) as PerformancePaintTiming[];

  if (!navEntry) return;

  const metrics: Record<string, number | string> = {
    page_location: path,
    event_category: "performance",
    dom_content_loaded: Math.round(navEntry.domContentLoadedEventEnd),
    load_time: Math.round(navEntry.loadEventEnd),
  };

  const firstPaint = paintEntries.find((e) => e.name === "first-paint");
  const firstContentfulPaint = paintEntries.find(
    (e) => e.name === "first-contentful-paint"
  );

  if (firstPaint) metrics.first_paint = Math.round(firstPaint.startTime);
  if (firstContentfulPaint)
    metrics.first_contentful_paint = Math.round(firstContentfulPaint.startTime);

  try {
    ReactGA.event("page_timing", metrics);
    console.log("⏱️ Page timing metrics sent:", metrics);
  } catch (error) {
    console.error("❌ Error tracking page timing:", error);
  }
};

export const trackGA4ViewPage = (path: string, title?: string): void => {
  if (!isGA4Initialized) {
    console.warn("⚠️ GA4 not initialized yet, cannot track page view");
    return;
  }

  try {
    ReactGA.send({
      hitType: "pageview",
      page: path,
      title: title || document.title,
    });
    trackGA4PageTiming(path);
    console.log(`📄 Page view tracked: ${path}`);
  } catch (error) {
    console.error("❌ Error tracking page view:", error);
  }
};

export const trackGA4Event = (
  eventName: string,
  params: Record<string, any> = {}
): void => {
  if (!isGA4Initialized) {
    console.warn(
      `⚠️ GA4 not initialized yet, cannot track event: ${eventName}`
    );
    return;
  }

  try {
    ReactGA.event(eventName, {
      ...params,
      debug_mode: import.meta.env.DEV,
      timestamp: new Date().toISOString(),
    });
    console.log(`📊 GA4 Event: ${eventName}`, params);
  } catch (error) {
    console.error("❌ GA4 trackEvent error:", error);
  }
};

export const setGA4User = (userId: string | null): void => {
  if (!isGA4Initialized) {
    console.warn("⚠️ GA4 not initialized yet, cannot set user");
    return;
  }
  try {
    ReactGA.set({ user_id: userId });
    console.log("👤 GA4 User set:", userId);
  } catch (error) {
    console.error("❌ GA4 setUser error:", error);
  }
};

export const setGA4UserProperties = (
  properties: Record<string, any> = {}
): void => {
  if (!isGA4Initialized) {
    console.warn("⚠️ GA4 not initialized yet, cannot set user properties");
    return;
  }

  try {
    ReactGA.gtag("set", "user_properties", properties);
    console.log("👤 GA4 User Properties set:", properties);
  } catch (error) {
    console.error("❌ GA4 setUserProperties error:", error);
  }
};

export const trackGA4Error = (
  error: Error | string,
  component: string,
  additionalParams: Record<string, any> = {}
): void => {
  if (!isGA4Initialized) {
    console.warn("⚠️ GA4 not initialized yet, cannot track error");
    return;
  }

  const errorObj = typeof error === "string" ? new Error(error) : error;

  try {
    ReactGA.event("exception", {
      description: errorObj.message,
      fatal: false,
      component,
      error_name: errorObj.name,
      stack_trace: errorObj.stack || "no_stack_trace",
      ...additionalParams,
    });

    console.log(`🚨 GA4 Error tracked from ${component}:`, errorObj.message);
  } catch (err) {
    console.error("❌ GA4 trackError error:", err);
  }
};
