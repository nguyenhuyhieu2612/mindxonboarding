import * as appInsights from "applicationinsights";
import { config } from "./config";
import { logger } from "../utils";

export function initializeAppInsights(): void {
  const connectionString = config.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString || connectionString.trim() === "") {
    logger.warn(
      "Application Insights connection string not configured. Telemetry collection disabled."
    );
    return;
  }

  try {
    appInsights
      .setup(connectionString)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start();

    appInsights.defaultClient.context.tags[
      appInsights.defaultClient.context.keys.cloudRole
    ] = "mindx-backend-api";
    appInsights.defaultClient.context.tags[
      appInsights.defaultClient.context.keys.cloudRoleInstance
    ] = process.env.HOSTNAME || process.env.COMPUTERNAME || "local";

    appInsights.defaultClient.addTelemetryProcessor((envelope) => {
      const commonProps = {
        Environment: config.NODE_ENV,
        Service: config.APP_NAME,
        Version: config.APP_VERSION,
        Hostname:
          process.env.HOSTNAME || process.env.COMPUTERNAME || "localhost",
      };

      if (!envelope.data || !envelope.data.baseData) return true;

      if (!envelope.data.baseData.properties) {
        envelope.data.baseData.properties = {};
      }

      const properties = envelope.data.baseData.properties;

      // Merge common properties (existing properties take precedence)
      Object.keys(commonProps).forEach((key) => {
        if (!(key in properties)) {
          properties[key] = commonProps[key as keyof typeof commonProps];
        }
      });

      return true;
    });

    logger.info("✅ Application Insights initialized successfully");
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
