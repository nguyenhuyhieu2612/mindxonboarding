import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const requestCounter = new Counter("requests_sent");
const errorRate = new Rate("error_rate");
const responseTime = new Trend("response_time");

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "2m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "2m", target: 300 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    error_rate: ["rate<0.10"],
    http_req_failed: ["rate<0.10"],
  },
};

const BASE_URL = "https://hieunh01.mindx.edu.vn";

export default function () {
  const testScenarios = [
    testHealthEndpoint,
    testApiHealthEndpoint,
    testProtectedEndpoint,
    testMultipleRequests,
  ];

  const scenario =
    testScenarios[Math.floor(Math.random() * testScenarios.length)];
  scenario();

  sleep(Math.random() * 1.5 + 0.5);
}

function testHealthEndpoint() {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: "health" },
  });

  requestCounter.add(1);

  const success = check(res, {
    "health: status is 200": (r) => r.status === 200,
    "health: response time OK": (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
}

function testApiHealthEndpoint() {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { endpoint: "api_health" },
  });

  requestCounter.add(1);

  const success = check(res, {
    "api health: status is 200": (r) => r.status === 200,
    "api health: response time OK": (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
}

function testProtectedEndpoint() {
  const res = http.get(`${BASE_URL}/api/users/me`, {
    tags: { endpoint: "protected" },
  });

  requestCounter.add(1);

  const success = check(res, {
    "protected: got response": (r) => r.status === 200 || r.status === 401,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
}

function testMultipleRequests() {
  const responses = http.batch([
    ["GET", `${BASE_URL}/health`, null, { tags: { endpoint: "health_batch" } }],
    [
      "GET",
      `${BASE_URL}/api/health`,
      null,
      { tags: { endpoint: "api_health_batch" } },
    ],
  ]);

  requestCounter.add(responses.length);

  responses.forEach((res) => {
    const success = check(res, {
      "batch: status is OK": (r) => r.status === 200 || r.status === 401,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
  });
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs.values.count;
  const duration = data.state.testRunDurationMs / 1000;
  const avgReqPerSec = totalReqs / duration;
  const errorRatePct = data.metrics.error_rate.values.rate * 100;
  const p95Latency = data.metrics.http_req_duration.values["p(95)"];
  const p99Latency = data.metrics.http_req_duration.values["p(99)"];

  console.log("\n=== CAPACITY VALIDATION RESULTS ===");
  console.log(`Total Requests: ${totalReqs}`);
  console.log(`Test Duration: ${duration.toFixed(2)}s`);
  console.log(`Average Load: ${avgReqPerSec.toFixed(2)} req/s`);
  console.log(`Peak Load: 300 concurrent users`);
  console.log(`Error Rate: ${errorRatePct.toFixed(2)}%`);
  console.log(`P95 Latency: ${p95Latency.toFixed(2)}ms`);
  console.log(`P99 Latency: ${p99Latency.toFixed(2)}ms`);

  console.log("\n📊 LOAD STAGES:");
  console.log("  Stage 1 (0-1m):   10 users  - Baseline");
  console.log("  Stage 2 (1-3m):   50 users  - Light load");
  console.log("  Stage 3 (3-5m):  100 users  - Medium load");
  console.log("  Stage 4 (5-7m):  200 users  - Heavy load");
  console.log("  Stage 5 (7-9m):  300 users  - Stress test");
  console.log("  Stage 6 (9-10m):   0 users  - Cool down");

  console.log("\n✅ CHECK APP INSIGHTS - CAPACITY METRICS:");
  console.log("\n1. Performance Counters:");
  console.log("   Go to: Application Insights > Metrics");
  console.log("   Select: Process CPU (%), Available Memory");
  console.log("   Time range: Last 30 minutes");
  console.log("   Expected: CPU/Memory should increase during test stages");
  console.log("\n2. Run KQL query for CPU:");
  console.log("   performanceCounters");
  console.log("   | where timestamp > ago(30m)");
  console.log('   | where name == "% Processor Time"');
  console.log(
    "   | summarize AvgCPU=avg(value), MaxCPU=max(value) by bin(timestamp, 1m)"
  );
  console.log("   | render timechart");
  console.log("\n3. Run KQL query for Memory:");
  console.log("   performanceCounters");
  console.log("   | where timestamp > ago(30m)");
  console.log('   | where name == "Available Bytes"');
  console.log("   | summarize AvgMemory=avg(value) by bin(timestamp, 1m)");
  console.log("   | render timechart");

  console.log("\n✅ CHECK KUBERNETES - POD METRICS:");
  console.log("\n   kubectl top pods -n mindx-test");
  console.log("   kubectl top nodes");
  console.log("   kubectl get hpa -n mindx-test  # If autoscaling enabled");
  console.log("\n   Expected: Resource usage should reflect load patterns");

  console.log("\n✅ VALIDATION CHECKLIST:");
  console.log("   [ ] CPU usage increased during load stages");
  console.log("   [ ] Memory usage increased under stress");
  console.log("   [ ] Response time degraded gracefully");
  console.log("   [ ] No pod crashes or restarts");
  console.log(
    "   [ ] App Insights shows correlation between load and resources"
  );
  console.log("   [ ] Kubernetes metrics match App Insights data");
  console.log("====================================\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
