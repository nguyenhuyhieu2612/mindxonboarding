import * as appInsights from "applicationinsights";
import { ENVIRONMENT_VARIABLES } from "./environment-variables";
import { logger } from "../utils/logger";

export function initializeAppInsights(): void {
  const connectionString =
    ENVIRONMENT_VARIABLES.AZURE.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString || connectionString.trim() === "") {
    logger.warn(
      "Application Insights connection string not configured. Telemetry collection disabled."
    );
    return;
  }

  try {
    appInsights
      .setup(connectionString)
      .setAutoDependencyCorrelation(true) // Correlate requests across distributed services
      .setAutoCollectRequests(true) // Collect HTTP requests (Latency + Traffic)
      .setAutoCollectPerformance(true, true) // Collect performance counters (Capacity)
      .setAutoCollectExceptions(true) // Collect unhandled exceptions (Error Rate)
      .setAutoCollectDependencies(true) // Collect external dependencies (DB, APIs)
      .setAutoCollectConsole(true, true) // Collect console.log/error as traces
      .setAutoCollectHeartbeat(true) // Send heartbeat for availability monitoring
      .setUseDiskRetryCaching(true) // Retry failed telemetry sends
      .setSendLiveMetrics(true) // Enable Live Metrics Stream
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C) // Support W3C trace context
      .start();

    appInsights.defaultClient.context.tags["ai.cloud.role"] =
      "mindx-backend-api";
    appInsights.defaultClient.context.tags["ai.cloud.roleInstance"] =
      process.env.HOSTNAME || process.env.COMPUTERNAME || "local";

    appInsights.defaultClient.commonProperties = {
      environment: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT,
      version: ENVIRONMENT_VARIABLES.APP.VERSION,
      service: ENVIRONMENT_VARIABLES.APP.NAME,
    };

    logger.info("✅ Application Insights initialized successfully", {
      cloudRole: "mindx-backend-api",
      environment: ENVIRONMENT_VARIABLES.APP.ENVIRONMENT,
    });
  } catch (error: any) {
    logger.error("❌ Failed to initialize Application Insights", {
      error: error.message,
      stack: error.stack,
    });
  }
}

export function getAppInsightsClient(): appInsights.TelemetryClient | null {
  try {
    return appInsights.defaultClient;
  } catch {
    return null;
  }
}
