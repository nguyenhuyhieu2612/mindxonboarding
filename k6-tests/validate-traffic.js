import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const requestCounter = new Counter("custom_requests");
const successRate = new Rate("success_rate");

export const options = {
  scenarios: {
    constant_load: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 50,
      maxVUs: 100,
      exec: "constantLoad",
    },

    ramping_load: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "2m", target: 100 },
        { duration: "1m", target: 10 },
      ],
      exec: "rampingLoad",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    errors: ["rate<0.05"],
    custom_requests: ["count>10000"],
  },
};

const BASE_URL = "https://hieunh01.mindx.edu.vn";

let totalRequests = 0;

export function constantLoad() {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { scenario: "constant", endpoint: "health" },
  });

  requestCounter.add(1);
  totalRequests++;

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  successRate.add(res.status === 200);
}

export function rampingLoad() {
  const endpoints = [
    { url: `${BASE_URL}/health`, name: "health" },
    { url: `${BASE_URL}/api/health`, name: "api-health" },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(endpoint.url, {
    tags: { scenario: "ramping", endpoint: endpoint.name },
  });

  requestCounter.add(1);
  totalRequests++;

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  successRate.add(res.status === 200);

  sleep(Math.random() * 0.1);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs.values.count;
  const duration = data.state.testRunDurationMs / 1000;
  const reqPerSec = totalReqs / duration;
  const successRatePct = data.metrics.success_rate.values.rate * 100;

  console.log("\n=== TRAFFIC VOLUME VALIDATION RESULTS ===");
  console.log(`Total Requests: ${totalReqs}`);
  console.log(`Test Duration: ${duration.toFixed(2)}s`);
  console.log(`Average Requests/Second: ${reqPerSec.toFixed(2)}`);
  console.log(`Success Rate: ${successRatePct.toFixed(2)}%`);
  console.log(
    `Failed Requests: ${
      data.metrics.http_reqs.values.count -
      data.metrics.success_rate.values.rate *
        data.metrics.http_reqs.values.count
    }`
  );

  console.log("\n✅ CHECK APP INSIGHTS:");
  console.log("1. Go to Application Insights > Metrics");
  console.log(
    "2. Select metric: Server requests (requests/performanceCounters)"
  );
  console.log("3. Time range: Last 30 minutes");
  console.log("4. Verify request count matches k6 results:");
  console.log(
    `   Expected: ~${totalReqs} requests over ${duration.toFixed(0)} seconds`
  );
  console.log("   Expected rate: ~100 req/s during constant load");
  console.log("\n5. Run KQL query:");
  console.log("   requests");
  console.log("   | where timestamp > ago(30m)");
  console.log("   | summarize RequestCount=count() by bin(timestamp, 1m)");
  console.log("   | render timechart");
  console.log("=========================================\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
