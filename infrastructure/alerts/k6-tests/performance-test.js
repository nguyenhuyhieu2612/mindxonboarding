import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '3m', target: 10 },  
    
    { duration: '1m', target: 50 },  
    { duration: '5m', target: 50 },  
    
    { duration: '2m', target: 10 }, 
    { duration: '2m', target: 0 },   
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<10000', 'p(99)<15000'],
    'errors': ['rate<0.1'],
  },
};

const API_URL = __ENV.API_URL || 'https://your-api.azurewebsites.net';

export default function () {
  const endpoints = [
    '/api/health',
    '/api/users/me',
    '/api/test-slow?delay=5000',  
  ];
  
  let endpoint;
  const stage = __ITER % 100;
  
  if (__VU > 30) {
    endpoint = stage < 60 ? endpoints[2] : endpoints[Math.floor(Math.random() * 2)];
  } else {
    endpoint = stage < 20 ? endpoints[2] : endpoints[Math.floor(Math.random() * 2)];
  }
  
  const url = `${API_URL}${endpoint}`;
  
  const startTime = Date.now();
  const response = http.get(url, {
    tags: { name: endpoint },
    timeout: '60s',
  });
  const duration = Date.now() - startTime;
  
  latency.add(duration);
  errorRate.add(response.status !== 200);
  
  const checkRes = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 30000,
  });
  
  sleep(Math.random() * 2 + 1); 
}

export function setup() {
  console.log('🚀 Starting Performance Alert Test');
  console.log(`📍 API URL: ${API_URL}`);
  console.log('');
  console.log('Test phases:');
  console.log('  Phase 1 (0-5m):   Baseline traffic (10 users)');
  console.log('  Phase 2 (5-11m):  High load + slow requests (50 users)');
  console.log('  Phase 3 (11-15m): Return to normal');
  console.log('');
  console.log('Expected alerts to fire:');
  console.log('  ✅ performance-p95-latency-above-5s');
  console.log('  ✅ performance-p99-latency-above-10s');
  console.log('  ✅ performance-avg-spike-300pct');
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Performance test complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Wait 10-15 minutes for alerts to evaluate');
  console.log('  2. Check Azure Portal → Monitor → Alerts');
  console.log('  3. Check Application Insights → Performance');
  console.log('  4. Verify email notifications received');
  console.log('');
}

