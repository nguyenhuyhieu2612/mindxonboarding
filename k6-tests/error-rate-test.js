import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";

const errorRate = new Rate("errors");
const error5xx = new Rate("errors_5xx");
const totalRequests = new Counter("total_requests");
const failedRequests = new Counter("failed_requests");

export const options = {
  stages: [
    { duration: "2m", target: 20 },
    { duration: "3m", target: 20 },

    { duration: "1m", target: 30 },
    { duration: "5m", target: 30 },

    { duration: "2m", target: 20 },
    { duration: "2m", target: 0 },
  ],

  thresholds: {
    http_req_failed: ["rate<0.5"],
  },
};

const API_URL = "https://hieunh01.mindx.edu.vn";
const ERROR_RATE = parseFloat(__ENV.ERROR_RATE) || 10;

export default function () {
  const iteration = __ITER;
  const currentVU = __VU;

  let shouldError = false;
  let errorCode = 500;

  if (currentVU > 20) {
    shouldError = Math.random() < ERROR_RATE / 100;
    // Mix of error codes
    errorCode = [500, 502, 503, 500, 500][Math.floor(Math.random() * 5)];
  } else {
    shouldError = Math.random() < 0.01;
    errorCode = 500;
  }

  let response;
  let endpoint;

  if (shouldError) {
    endpoint = `/api/test-error?code=${errorCode}`;
    response = http.get(`${API_URL}${endpoint}`, {
      tags: { name: "error_endpoint", expected: "error" },
      timeout: "30s",
    });
  } else {
    const endpoints = ["/api/health", "/api/users/me"];
    endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    response = http.get(`${API_URL}${endpoint}`, {
      tags: { name: endpoint },
      timeout: "30s",
    });
  }

  totalRequests.add(1);

  const isError = response.status >= 400;
  const is5xxError = response.status >= 500 && response.status < 600;

  errorRate.add(isError);
  error5xx.add(is5xxError);

  if (isError) {
    failedRequests.add(1);
  }

  if (isError && iteration % 10 === 0) {
    console.log(`❌ Error: ${response.status} on ${endpoint}`);
  }

  check(response, {
    "response received": (r) => r.status !== 0,
  });

  sleep(Math.random() * 1.5 + 0.5); // 0.5-2 seconds
}

export function setup() {
  console.log("🚀 Starting Error Rate Alert Test");
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📊 Target error rate: ${ERROR_RATE}%`);
  console.log("");
  console.log("Test phases:");
  console.log("  Phase 1 (0-5m):   Normal traffic (~1% errors)");
  console.log(`  Phase 2 (5-11m):  High error rate (~${ERROR_RATE}% errors)`);
  console.log("  Phase 3 (11-15m): Return to normal");
  console.log("");
  console.log("Expected alerts to fire:");
  console.log("  ✅ error-rate-above-5pct (if error rate > 5%)");
  console.log("  ✅ error-rate-5xx-above-1pct (if 5xx errors > 1%)");
  console.log("  ✅ error-rate-critical-endpoints-failing (maybe)");
  console.log("");
}

export function teardown(data) {
  console.log("");
  console.log("✅ Error rate test complete!");
  console.log("");
  console.log("Verification query (run in App Insights Logs):");
  console.log("────────────────────────────────────────────");
  console.log("requests");
  console.log("| where timestamp > ago(20m)");
  console.log("| summarize ");
  console.log("    Total = count(),");
  console.log("    Failed = countif(success == false),");
  console.log("    Server5xx = countif(resultCode >= 500)");
  console.log("| extend ");
  console.log("    ErrorRate = (Failed * 100.0) / Total,");
  console.log("    Server5xxRate = (Server5xx * 100.0) / Total");
  console.log("────────────────────────────────────────────");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Wait 10-15 minutes");
  console.log("  2. Check Alerts → Alert history");
  console.log("  3. Verify email notifications");
  console.log("");
}

export function handleSummary(data) {
  const totalReqs = data.metrics.total_requests.values.count;
  const failedReqs = data.metrics.failed_requests.values.count;
  const errorRatePct = data.metrics.errors.values.rate * 100;
  const error5xxPct = data.metrics.errors_5xx.values.rate * 100;

  console.log("");
  console.log("📊 Test Summary:");
  console.log(`   Total requests: ${totalReqs}`);
  console.log(`   Failed requests: ${failedReqs}`);
  console.log(`   Overall error rate: ${errorRatePct.toFixed(2)}%`);
  console.log(`   5xx error rate: ${error5xxPct.toFixed(2)}%`);
  console.log("");

  return {
    stdout: "",
  };
}
