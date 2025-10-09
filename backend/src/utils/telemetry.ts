import { KnownSeverityLevel } from "applicationinsights";
import { getAppInsightsClient } from "../config/app-insights";
import { config } from "../config";

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
      ...properties,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
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
    properties: {
      ...properties,
      environment: config.NODE_ENV,
    },
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
    properties: {
      ...properties,
      environment: config.NODE_ENV,
      stack: error.stack,
    },
  });
}

export function trackDependency(
  name: string,
  method: string,
  url: string,
  duration: number,
  success: boolean,
  resultCode: string,
  dependencyTypeName: string,
  properties?: { [key: string]: any }
): void {
  const client = getAppInsightsClient();
  if (!client) return;

  client.trackDependency({
    name,
    target: url,
    data: `${method} ${url}`,
    duration,
    success,
    resultCode,
    dependencyTypeName,
    properties: {
      ...properties,
      environment: config.NODE_ENV,
    },
  });
}

export function trackRequest(
  method: string,
  url: string,
  duration: number,
  statusCode: number,
  success: boolean,
  properties = {}
) {
  const client = getAppInsightsClient();
  if (!client) return;
  client.trackRequest({
    name: `${method} ${url}`,
    url,
    duration,
    resultCode: statusCode.toString(),
    success,
    properties: {
      ...properties,
      environment: config.NODE_ENV,
    },
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
    properties: {
      ...properties,
      environment: config.NODE_ENV,
    },
  });
}

export async function flushTelemetry(): Promise<void> {
  const client = getAppInsightsClient();
  if (!client) {
    return;
  }
  await client.flush();
}
