// k6 Error Rate Alert Test
// Tests error rate and 5xx error alerts

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const error5xx = new Rate('errors_5xx');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
export const options = {
  stages: [
    // Phase 1: Normal traffic (low error rate)
    { duration: '2m', target: 20 },   // Ramp up
    { duration: '3m', target: 20 },   // Normal traffic, ~1% errors
    
    // Phase 2: Generate high error rate (trigger alerts)
    { duration: '1m', target: 30 },   // Increase load
    { duration: '5m', target: 30 },   // High error rate ~10%
    
    // Phase 3: Return to normal
    { duration: '2m', target: 20 },   // Reduce errors
    { duration: '2m', target: 0 },    // Stop
  ],
  
  thresholds: {
    'http_req_failed': ['rate<0.5'],  // Allow up to 50% for testing
  },
};

const API_URL = __ENV.API_URL || 'https://your-api.azurewebsites.net';
const ERROR_RATE = parseFloat(__ENV.ERROR_RATE) || 10;  // 10% default

export default function () {
  const iteration = __ITER;
  const currentVU = __VU;
  
  // Determine if this request should be an error
  let shouldError = false;
  let errorCode = 500;
  
  if (currentVU > 20) {
    // Phase 2: High error rate
    shouldError = Math.random() < (ERROR_RATE / 100);
    // Mix of error codes
    errorCode = [500, 502, 503, 500, 500][Math.floor(Math.random() * 5)];
  } else {
    // Phase 1: Low error rate (~1%)
    shouldError = Math.random() < 0.01;
    errorCode = 500;
  }
  
  let response;
  let endpoint;
  
  if (shouldError) {
    // Generate error request
    endpoint = `/api/test-error?code=${errorCode}`;
    response = http.get(`${API_URL}${endpoint}`, {
      tags: { name: 'error_endpoint', expected: 'error' },
      timeout: '30s',
    });
  } else {
    // Normal successful request
    const endpoints = [
      '/api/health',
      '/api/users/me',
    ];
    endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    response = http.get(`${API_URL}${endpoint}`, {
      tags: { name: endpoint },
      timeout: '30s',
    });
  }
  
  // Record metrics
  totalRequests.add(1);
  
  const isError = response.status >= 400;
  const is5xxError = response.status >= 500 && response.status < 600;
  
  errorRate.add(isError);
  error5xx.add(is5xxError);
  
  if (isError) {
    failedRequests.add(1);
  }
  
  // Log errors for visibility
  if (isError && iteration % 10 === 0) {
    console.log(`❌ Error: ${response.status} on ${endpoint}`);
  }
  
  // Check response
  check(response, {
    'response received': (r) => r.status !== 0,
  });
  
  // Think time
  sleep(Math.random() * 1.5 + 0.5);  // 0.5-2 seconds
}

export function setup() {
  console.log('🚀 Starting Error Rate Alert Test');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📊 Target error rate: ${ERROR_RATE}%`);
  console.log('');
  console.log('Test phases:');
  console.log('  Phase 1 (0-5m):   Normal traffic (~1% errors)');
  console.log(`  Phase 2 (5-11m):  High error rate (~${ERROR_RATE}% errors)`);
  console.log('  Phase 3 (11-15m): Return to normal');
  console.log('');
  console.log('Expected alerts to fire:');
  console.log('  ✅ error-rate-above-5pct (if error rate > 5%)');
  console.log('  ✅ error-rate-5xx-above-1pct (if 5xx errors > 1%)');
  console.log('  ✅ error-rate-critical-endpoints-failing (maybe)');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Error rate test complete!');
  console.log('');
  console.log('Verification query (run in App Insights Logs):');
  console.log('────────────────────────────────────────────');
  console.log('requests');
  console.log('| where timestamp > ago(20m)');
  console.log('| summarize ');
  console.log('    Total = count(),');
  console.log('    Failed = countif(success == false),');
  console.log('    Server5xx = countif(resultCode >= 500)');
  console.log('| extend ');
  console.log('    ErrorRate = (Failed * 100.0) / Total,');
  console.log('    Server5xxRate = (Server5xx * 100.0) / Total');
  console.log('────────────────────────────────────────────');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Wait 10-15 minutes');
  console.log('  2. Check Alerts → Alert history');
  console.log('  3. Verify email notifications');
  console.log('');
}

// Custom summary at end
export function handleSummary(data) {
  const totalReqs = data.metrics.total_requests.values.count;
  const failedReqs = data.metrics.failed_requests.values.count;
  const errorRatePct = data.metrics.errors.values.rate * 100;
  const error5xxPct = data.metrics.errors_5xx.values.rate * 100;
  
  console.log('');
  console.log('📊 Test Summary:');
  console.log(`   Total requests: ${totalReqs}`);
  console.log(`   Failed requests: ${failedReqs}`);
  console.log(`   Overall error rate: ${errorRatePct.toFixed(2)}%`);
  console.log(`   5xx error rate: ${error5xxPct.toFixed(2)}%`);
  console.log('');
  
  return {
    'stdout': '', // Suppress default summary
  };
}

