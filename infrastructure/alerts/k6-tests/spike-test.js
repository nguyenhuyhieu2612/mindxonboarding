// k6 Spike Test
// Tests response time spike (300% increase) alert

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const latency = new Trend('response_time');

// Spike test configuration
export const options = {
  stages: [
    // Phase 1: Establish baseline (7 minutes)
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '6m', target: 10 },   // Stable baseline
    
    // Phase 2: SPIKE! (sudden 5x increase)
    { duration: '30s', target: 50 },  // Sudden spike
    { duration: '10m', target: 50 },  // Maintain spike
    
    // Phase 3: Return to baseline
    { duration: '2m', target: 10 },   // Ramp down
    { duration: '2m', target: 0 },    // Stop
  ],
};

const API_URL = __ENV.API_URL || 'https://your-api.azurewebsites.net';

export default function () {
  const currentVU = __VU;
  
  // During spike, hit slower endpoints
  let endpoint;
  if (currentVU > 40) {
    // Spike phase - mostly slow requests
    endpoint = '/api/test-slow?delay=4000';  // 4 second delay
  } else if (currentVU > 10) {
    // Transition - mix of fast and slow
    endpoint = Math.random() < 0.5 ? '/api/health' : '/api/test-slow?delay=3000';
  } else {
    // Baseline - fast requests
    endpoint = '/api/health';
  }
  
  const url = `${API_URL}${endpoint}`;
  
  const startTime = Date.now();
  const response = http.get(url, {
    tags: { phase: currentVU > 40 ? 'spike' : 'baseline' },
    timeout: '30s',
  });
  const duration = Date.now() - startTime;
  
  latency.add(duration);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Minimal sleep during spike to maximize load
  if (currentVU > 40) {
    sleep(Math.random() * 0.5 + 0.5);  // 0.5-1 sec
  } else {
    sleep(Math.random() * 2 + 1);      // 1-3 sec
  }
}

export function setup() {
  console.log('🚀 Starting Response Time Spike Test');
  console.log(`📍 API URL: ${API_URL}`);
  console.log('');
  console.log('This test simulates a sudden traffic spike');
  console.log('to trigger the 300% response time increase alert');
  console.log('');
  console.log('Test phases:');
  console.log('  Phase 1 (0-7m):    Establish baseline (10 users, fast requests)');
  console.log('  Phase 2 (7-17.5m): SPIKE! (50 users, slow requests)');
  console.log('  Phase 3 (17.5-22m): Return to baseline');
  console.log('');
  console.log('Expected alert to fire:');
  console.log('  ✅ performance-avg-spike-300pct');
  console.log('');
  console.log('Timeline:');
  console.log('  T+7m:   Spike begins');
  console.log('  T+12m:  Data in App Insights');
  console.log('  T+17m:  Alert should fire');
  console.log('  T+22m:  Test complete, alert should resolve');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Spike test complete!');
  console.log('');
  console.log('Verification:');
  console.log('  1. Check App Insights → Performance');
  console.log('     - Should see clear spike in response times');
  console.log('     - Baseline: ~200-500ms');
  console.log('     - Spike: ~2000-5000ms (300%+ increase)');
  console.log('');
  console.log('  2. Check Alerts → Alert history');
  console.log('     - Look for: performance-avg-spike-300pct');
  console.log('');
  console.log('  3. Verify email notification received');
  console.log('');
}

