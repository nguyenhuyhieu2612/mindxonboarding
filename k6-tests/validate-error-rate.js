import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";

const error4xxRate = new Rate("error_4xx_rate");
const error5xxRate = new Rate("error_5xx_rate");
const timeoutRate = new Rate("timeout_rate");
const totalErrors = new Counter("total_errors");

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "2m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    error_4xx_rate: ["rate>0"],
    error_5xx_rate: ["rate>0"],
    total_errors: ["count>50"],
  },
};

const BASE_URL = "https://hieunh01.mindx.edu.vn";

let stats = {
  total: 0,
  success: 0,
  error401: 0,
  error404: 0,
  error500: 0,
  timeout: 0,
};

export default function () {
  const scenario = Math.floor(Math.random() * 6);

  switch (scenario) {
    case 0:
      testSuccess();
      break;
    case 1:
      test401Error();
      break;
    case 2:
      test404Error();
      break;
    case 3:
      test500Error();
      break;
    case 4:
      testTimeout();
      break;
    case 5:
      testRandomEndpoint();
      break;
  }

  sleep(1);
}

function testSuccess() {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { test_type: "success" },
  });

  stats.total++;
  check(res, {
    "success: status is 200": (r) => r.status === 200,
  }) && stats.success++;
}

function test401Error() {
  const res = http.get(`${BASE_URL}/api/users/me`, {
    tags: { test_type: "error_401" },
  });

  stats.total++;
  const is401 = check(res, {
    "error 401: status is 401": (r) => r.status === 401,
  });

  if (is401) {
    error4xxRate.add(1);
    totalErrors.add(1);
    stats.error401++;
  } else {
    error4xxRate.add(0);
  }
}

function test404Error() {
  const res = http.get(`${BASE_URL}/api/nonexistent-endpoint-${Date.now()}`, {
    tags: { test_type: "error_404" },
  });

  stats.total++;
  const is404 = check(res, {
    "error 404: status is 404": (r) => r.status === 404,
  });

  if (is404) {
    error4xxRate.add(1);
    totalErrors.add(1);
    stats.error404++;
  } else {
    error4xxRate.add(0);
  }
}

function test500Error() {
  const res = http.post(
    `${BASE_URL}/api/error-test`,
    JSON.stringify({ trigger: "error" }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { test_type: "error_500" },
    }
  );

  stats.total++;
  const is5xx = res.status >= 500 && res.status < 600;

  if (is5xx) {
    error5xxRate.add(1);
    totalErrors.add(1);
    stats.error500++;
  } else {
    error5xxRate.add(0);
  }

  check(res, {
    "error 5xx: status is 5xx": (r) => r.status >= 500,
  });
}

function testTimeout() {
  const res = http.get(`${BASE_URL}/api/slow-endpoint`, {
    timeout: "100ms",
    tags: { test_type: "timeout" },
  });

  stats.total++;

  if (res.error_code === 1050) {
    timeoutRate.add(1);
    totalErrors.add(1);
    stats.timeout++;
  } else {
    timeoutRate.add(0);
  }

  check(res, {
    "timeout: request timed out": (r) => r.error_code === 1050,
  });
}

function testRandomEndpoint() {
  const endpoints = ["/health", "/api/health", "/api/users"];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`, {
    tags: { test_type: "random" },
  });

  stats.total++;

  if (res.status >= 400) {
    if (res.status < 500) {
      error4xxRate.add(1);
    } else {
      error5xxRate.add(1);
    }
    totalErrors.add(1);
  }
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs.values.count;
  const error4xxCount = data.metrics.error_4xx_rate
    ? data.metrics.error_4xx_rate.values.count
    : 0;
  const error5xxCount = data.metrics.error_5xx_rate
    ? data.metrics.error_5xx_rate.values.count
    : 0;
  const timeoutCount = data.metrics.timeout_rate
    ? data.metrics.timeout_rate.values.count
    : 0;
  const totalErrorCount = data.metrics.total_errors.values.count;
  const errorRatePct = (totalErrorCount / totalReqs) * 100;

  console.log("\n=== ERROR RATE VALIDATION RESULTS ===");
  console.log(`Total Requests: ${totalReqs}`);
  console.log(`Total Errors: ${totalErrorCount}`);
  console.log(`Overall Error Rate: ${errorRatePct.toFixed(2)}%`);
  console.log("\nError Breakdown:");
  console.log(
    `  4xx Errors: ${error4xxCount} (${stats.error401} 401s, ${stats.error404} 404s)`
  );
  console.log(`  5xx Errors: ${error5xxCount} (${stats.error500} 500s)`);
  console.log(`  Timeouts: ${timeoutCount}`);
  console.log(`  Successful: ${totalReqs - totalErrorCount}`);

  console.log("\n✅ CHECK APP INSIGHTS:");
  console.log("1. Go to Application Insights > Failures");
  console.log("2. Time range: Last 30 minutes");
  console.log("3. Verify error counts and types match k6 results");
  console.log("\n4. Run KQL query to check error rate:");
  console.log("   requests");
  console.log("   | where timestamp > ago(30m)");
  console.log("   | summarize");
  console.log("       Total=count(),");
  console.log("       Errors=countif(success == false),");
  console.log("       ErrorRate=100.0 * countif(success == false) / count(),");
  console.log(
    '       Error4xx=countif(resultCode >= "400" and resultCode < "500"),'
  );
  console.log('       Error5xx=countif(resultCode >= "500")');
  console.log(`\n   Expected error rate: ~${errorRatePct.toFixed(2)}%`);
  console.log(`   Expected 4xx errors: ~${error4xxCount}`);
  console.log(`   Expected 5xx errors: ~${error5xxCount}`);
  console.log("\n5. Check Failures blade for error details and stack traces");
  console.log("======================================\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
