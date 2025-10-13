import {
  ApplicationInsights,
  ITelemetryItem,
} from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

const reactPlugin = new ReactPlugin();

const connectionString = import.meta.env
  .VITE_APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  console.info("✅ Application Insights initialized for frontend", {
    cloudRole: "mindx-frontend",
    environment: import.meta.env.MODE,
  });
} else {
  console.warn(
    "⚠️ Application Insights connection string not configured. Frontend telemetry disabled."
  );
}

const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString,
    // @ts-ignore - Type compatibility issue between plugin versions
    extensions: [reactPlugin],
    enableAutoRouteTracking: true,
    autoTrackPageVisitTime: true,
    disableExceptionTracking: false,
    enableUnhandledPromiseRejectionTracking: true,
    enableAjaxPerfTracking: true,
    enableAjaxErrorStatusText: true,
    maxAjaxCallsPerView: 100,
    disableAjaxTracking: false,
    disableFetchTracking: false,
    enableSessionStorageBuffer: true,
    enableCorsCorrelation: true,
    correlationHeaderExcludedDomains: ["*.queue.core.windows.net"],
    samplingPercentage: 100,
    maxBatchSizeInBytes: 10000,
    maxBatchInterval: 5000,
    enableDebug: import.meta.env.DEV,
    loggingLevelConsole: import.meta.env.DEV ? 1 : 0,
    loggingLevelTelemetry: 0,
    isBrowserLinkTrackingEnabled: false,
    disableConsoleTracking: true,
  },
});

appInsights.loadAppInsights();

appInsights.addTelemetryInitializer((env: ITelemetryItem) => {
  if (env.tags) {
    env.tags["ai.cloud.role"] = "mindx-frontend";
    env.tags["ai.cloud.roleInstance"] = window.location.hostname;
  }
});

export { reactPlugin, appInsights };

export const trackAIEvent = (
  name: string,
  properties?: { [key: string]: string },
  measurements?: { [key: string]: number }
) => {
  appInsights.trackEvent({
    name,
    properties: {
      ...properties,
      Environment: import.meta.env.MODE,
      UserAgent: navigator.userAgent,
      Timestamp: new Date().toISOString(),
    },
    measurements,
  });
};

export const trackAIException = (
  error: Error,
  properties?: { [key: string]: string }
) => {
  appInsights.trackException({
    exception: error,
    properties: {
      ...properties,
      Environment: import.meta.env.MODE,
      UserAgent: navigator.userAgent,
      Timestamp: new Date().toISOString(),
    },
  });
};

export const trackAIMetric = (
  name: string,
  value: number,
  properties?: { [key: string]: string }
) => {
  appInsights.trackMetric({
    name,
    average: value,
    properties: {
      ...properties,
      Environment: import.meta.env.MODE,
      UserAgent: navigator.userAgent,
      Timestamp: new Date().toISOString(),
    },
  });
};

export const setAIAuthenticatedUser = (userId: string, accountId?: string) => {
  appInsights.setAuthenticatedUserContext(userId, accountId, true);
};

export const clearAIAuthenticatedUser = () => {
  appInsights.clearAuthenticatedUserContext();
};

export const flushTelemetry = async () => {
  appInsights.flush();
};
