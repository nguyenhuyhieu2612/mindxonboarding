import { KnownSeverityLevel } from "applicationinsights";
import { getAppInsightsClient } from "../config/app-insights";

export function trackEvent(
  name: string,
  properties?: { [key: string]: string },
  measurements?: { [key: string]: number }
): void {
  const client = getAppInsightsClient();
  if (!client) return;

  client.trackEvent({
    name,
    properties: {
      timestamp: new Date().toISOString(),
      ...properties,
    },
    measurements,
  });
}

export function trackMetric(
  name: string,
  value: number,
  properties?: { [key: string]: string }
): void {
  const client = getAppInsightsClient();
  if (!client) return;

  client.trackMetric({
    name,
    value,
    properties,
  });
}

export function trackException(
  error: Error,
  properties?: { [key: string]: string }
): void {
  const client = getAppInsightsClient();
  if (!client) return;

  client.trackException({
    exception: error,
    properties,
  });
}

export function trackDependency(
  name: string,
  dependencyTypeName: string,
  data: string,
  duration: number,
  success: boolean,
  resultCode?: number
): void {
  const client = getAppInsightsClient();
  if (!client) return;

  client.trackDependency({
    name,
    dependencyTypeName,
    data,
    duration,
    success,
    resultCode,
  });
}

export function trackTrace(
  message: string,
  severity: KnownSeverityLevel = KnownSeverityLevel.Information,
  properties?: { [key: string]: string }
): void {
  const client = getAppInsightsClient();
  if (!client) return;

  client.trackTrace({
    message,
    severity,
    properties,
  });
}

export async function flushTelemetry(): Promise<void> {
  const client = getAppInsightsClient();
  if (!client) {
    return;
  }
  await client.flush();
}
