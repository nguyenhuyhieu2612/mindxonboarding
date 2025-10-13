import { KnownSeverityLevel, TelemetryClient } from "applicationinsights";
import { getAppInsightsClient } from "../config";
import { logger } from "../utils";

class TelemetryService {
  private client: TelemetryClient | null = null;

  constructor() {
    this.client = getAppInsightsClient();
  }

  trackEvent(
    eventName: string,
    properties?: Record<string, string>,
    measurements?: Record<string, number>
  ) {
    if (this.client) {
      this.client.trackEvent({
        name: eventName,
        properties,
        measurements,
      });
    }
  }

  trackMetric(
    metricName: string,
    value: number,
    properties?: Record<string, string>
  ) {
    if (this.client) {
      this.client.trackMetric({
        name: metricName,
        value,
        properties,
      });
    }
  }

  trackTrace(
    message: string,
    severity: KnownSeverityLevel = KnownSeverityLevel.Information,
    properties?: Record<string, string>,
    measurements?: Record<string, number>
  ) {
    if (this.client) {
      this.client.trackTrace({
        message,
        severity,
        properties,
        measurements,
      });
    }

    const line = `[${severity
      .toString()
      .toUpperCase()} ${message} ${JSON.stringify(properties, null, 2)}]`;

    severity === KnownSeverityLevel.Error ||
    severity === KnownSeverityLevel.Critical
      ? logger.error(line)
      : severity === KnownSeverityLevel.Warning
      ? logger.warn(line)
      : logger.info(line);
  }

  trackError(error: Error, context?: Record<string, any>) {
    if (this.client) {
      this.client.trackException({
        exception: error,
        properties: context,
      });
    }

    logger.error(error.message, { error, ...context });
  }
}

export const telemetryService = new TelemetryService();
