import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const latencyTrend = new Trend("custom_latency");
const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    { duration: "1m", target: 20 },
    { duration: "3m", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(50)<1000", "p(95)<2000", "p(99)<5000"],
    "http_req_duration{endpoint:health}": ["p(95)<500"],
    "http_req_duration{endpoint:api}": ["p(95)<2000"],
    errors: ["rate<0.01"],
  },
};

const BASE_URL = "https://hieunh01.mindx.edu.vn";

export default function () {
  const healthRes = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: "health" },
  });

  check(healthRes, {
    "health check status is 200": (r) => r.status === 200,
    "health check latency < 500ms": (r) => r.timings.duration < 500,
  });

  latencyTrend.add(healthRes.timings.duration);
  errorRate.add(healthRes.status !== 200);

  sleep(1);

  const apiRes = http.get(`${BASE_URL}/api/health`, {
    tags: { endpoint: "api" },
  });

  check(apiRes, {
    "api health status is 200": (r) => r.status === 200,
    "api latency < 2000ms": (r) => r.timings.duration < 2000,
  });

  latencyTrend.add(apiRes.timings.duration);
  errorRate.add(apiRes.status !== 200);

  sleep(2);

  const headers = {
    "Content-Type": "application/json",
  };

  const userRes = http.get(`${BASE_URL}/api/users/me`, {
    headers: headers,
    tags: { endpoint: "user" },
  });

  check(userRes, {
    "user endpoint responds": (r) => r.status === 200 || r.status === 401,
    "user endpoint latency < 3000ms": (r) => r.timings.duration < 3000,
  });

  latencyTrend.add(userRes.timings.duration);

  sleep(2);
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration.values["p(50)"];
  const p95 = data.metrics.http_req_duration.values["p(95)"];
  const p99 = data.metrics.http_req_duration.values["p(99)"];

  console.log("\n=== LATENCY VALIDATION RESULTS ===");
  console.log(`P50 Latency: ${p50.toFixed(2)}ms (Target: <1000ms)`);
  console.log(`P95 Latency: ${p95.toFixed(2)}ms (Target: <2000ms)`);
  console.log(`P99 Latency: ${p99.toFixed(2)}ms (Target: <5000ms)`);
  console.log(
    `Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(
      2
    )}% (Target: <1%)`
  );

  console.log("\n✅ CHECK APP INSIGHTS:");
  console.log("1. Go to Application Insights > Performance");
  console.log("2. Run KQL query:");
  console.log("   requests");
  console.log("   | where timestamp > ago(10m)");
  console.log(
    "   | summarize P50=percentile(duration, 50), P95=percentile(duration, 95), P99=percentile(duration, 99)"
  );
  console.log("3. Compare values with k6 results above");
  console.log("===================================\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
