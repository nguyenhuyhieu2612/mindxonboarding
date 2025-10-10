import {
  ApplicationInsights,
  ITelemetryItem,
} from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

const reactPlugin = new ReactPlugin();

const connectionString = import.meta.env
  .VITE_APPLICATIONINSIGHTS_CONNECTION_STRING;

const appInsights = new ApplicationInsights({
  config: {
    connectionString:
      connectionString ||
      "InstrumentationKey=23866d56-5506-435e-88fd-8bdba408025e;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=a2fc9fa4-e91d-4b4b-ae89-f0055b224004",
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

export { reactPlugin, appInsights };

export const trackEvent = (
  name: string,
  properties?: { [key: string]: string },
  measurements?: { [key: string]: number }
) => {
  appInsights.trackEvent({
    name,
    properties: {
      ...properties,
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
    measurements,
  });
};

export const trackPageView = (name: string, url?: string) => {
  appInsights.trackPageView({
    name,
    uri: url || window.location.href,
  });
};

export const trackException = (
  error: Error,
  properties?: { [key: string]: string }
) => {
  appInsights.trackException({
    exception: error,
    properties: {
      ...properties,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
    },
  });
};

export const trackMetric = (
  name: string,
  value: number,
  properties?: { [key: string]: string }
) => {
  appInsights.trackMetric({
    name,
    average: value,
    properties,
  });
};

export const trackUserAction = (
  action: string,
  properties?: { [key: string]: string }
) => {
  trackEvent("user_action", {
    action,
    ...properties,
  });
};

export const setAuthenticatedUser = (userId: string, accountId?: string) => {
  appInsights.setAuthenticatedUserContext(userId, accountId, true);
};

export const clearAuthenticatedUser = () => {
  appInsights.clearAuthenticatedUserContext();
};

export const flushTelemetry = async () => {
  appInsights.flush();
};
