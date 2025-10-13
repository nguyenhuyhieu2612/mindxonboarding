# k6 Alert Testing

Professional load testing for Azure Monitor alerts using k6.

## 🎯 Why k6?

```
✅ Industry-standard load testing tool
✅ Realistic traffic patterns
✅ Complex scenarios (spike, stress, soak tests)
✅ Built-in metrics and thresholds
✅ Beautiful CLI output
✅ Can simulate thousands of concurrent users
✅ JavaScript-based (easy to learn)
✅ Free and open source
```

---

## 📦 Installation

### Windows (PowerShell):

```powershell
# Using Chocolatey
choco install k6

# Or using winget
winget install k6 --source winget

# Or download installer
# https://k6.io/docs/get-started/installation/
```

### macOS:

```bash
brew install k6
```

### Linux:

```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### Verify Installation:

```bash
k6 version
# Should show: k6 v0.xx.x
```

---

## 🚀 Quick Start

### 1. Set Your API URL:

```bash
# Windows PowerShell
$env:API_URL="https://your-api.azurewebsites.net"

# Linux/macOS
export API_URL="https://your-api.azurewebsites.net"
```

### 2. Run Tests:

```bash
cd infrastructure/alerts/k6-tests

# Test 1: Performance alerts (P95/P99)
k6 run performance-test.js

# Test 2: Error rate alerts
k6 run error-rate-test.js

# Test 3: Response time spike (300%)
k6 run spike-test.js
```

---

## 📊 Available Tests

### 1. Performance Test (`performance-test.js`)

**Duration:** ~15 minutes

**What it tests:**
- P95 latency > 5 seconds
- P99 latency > 10 seconds
- Response time spike > 300%

**Traffic pattern:**
```
Phase 1 (0-5m):   Baseline (10 users, normal speed)
Phase 2 (5-11m):  High load (50 users, slow requests)
Phase 3 (11-15m): Return to normal
```

**Run:**
```bash
k6 run performance-test.js
```

**With custom API:**
```bash
k6 run -e API_URL=https://your-api.com performance-test.js
```

---

### 2. Error Rate Test (`error-rate-test.js`)

**Duration:** ~15 minutes

**What it tests:**
- Overall error rate > 5%
- 5xx error rate > 1%
- Critical endpoint failures

**Traffic pattern:**
```
Phase 1 (0-5m):   Normal (20 users, ~1% errors)
Phase 2 (5-11m):  High errors (30 users, ~10% errors)
Phase 3 (11-15m): Return to normal
```

**Run:**
```bash
# Default 10% error rate
k6 run error-rate-test.js

# Custom error rate (15%)
k6 run -e API_URL=https://your-api.com -e ERROR_RATE=15 error-rate-test.js
```

---

### 3. Spike Test (`spike-test.js`)

**Duration:** ~22 minutes

**What it tests:**
- Response time increase > 300% from baseline

**Traffic pattern:**
```
Phase 1 (0-7m):    Establish baseline (10 users)
Phase 2 (7-17.5m): SPIKE! (50 users, 5x increase)
Phase 3 (17.5-22m): Return to baseline
```

**Run:**
```bash
k6 run spike-test.js
```

---

## 🎨 Advanced Usage

### Custom Virtual Users:

```bash
# Override stages with VUs
k6 run --vus 100 --duration 5m performance-test.js
```

### Custom Duration:

```bash
# Run for specific time
k6 run --duration 10m error-rate-test.js
```

### With Iterations:

```bash
# Run fixed number of iterations
k6 run --iterations 1000 performance-test.js
```

### Multiple Environment Variables:

```bash
k6 run \
  -e API_URL=https://your-api.com \
  -e ERROR_RATE=15 \
  -e SLOW_DELAY=8000 \
  error-rate-test.js
```

### Cloud Run (k6 Cloud):

```bash
# Upload and run in k6 Cloud
k6 cloud performance-test.js
```

---

## 📈 Understanding k6 Output

### During Test:

```
execution: local
   script: performance-test.js
   output: -

scenarios: (100.00%) 1 scenario, 50 max VUs, 15m30s max duration
          default: Up to 50 looping VUs for 15m0s over 3 stages

     ✓ status is 200
     ✓ response time OK

     checks.........................: 98.50% ✓ 1234    ✗ 19
     data_received..................: 4.5 MB 5.0 kB/s
     data_sent......................: 123 kB 136 B/s
     errors.........................: 1.50%  ✓ 19      ✗ 1234
   ✓ http_req_blocked...............: avg=1.2ms    min=0s     med=1ms    max=145ms
   ✓ http_req_duration..............: avg=5.2s     min=123ms  med=4.8s   max=15s
       { expected_response:true }...: avg=5.1s     min=123ms  med=4.7s   max=15s
   ✓ http_req_failed................: 1.50%  ✓ 19      ✗ 1234
     http_req_receiving.............: avg=234µs    min=0s     med=201µs  max=1.2ms
     http_req_sending...............: avg=123µs    min=0s     med=98µs   max=892µs
     http_req_tls_handshaking.......: avg=891µs    min=0s     med=0s     max=98ms
     http_req_waiting...............: avg=5.2s     min=122ms  med=4.8s   max=15s
     http_reqs......................: 1253   1.392/s
     iteration_duration.............: avg=7.8s     min=2.1s   med=7.3s   max=18s
     iterations.....................: 1253   1.392/s
     vus............................: 10     min=10    max=50
     vus_max........................: 50     min=50    max=50
```

### Key Metrics:

```
✓ checks: % of checks passed
  http_req_duration: Response times
    - avg: Average
    - min: Minimum
    - med: Median (P50)
    - max: Maximum
    - p(95): P95 (95th percentile)
    - p(99): P99 (99th percentile)
  
  http_req_failed: % of failed requests
  http_reqs: Total requests made
  vus: Current virtual users
```

---

## ✅ Verification Steps

### 1. During Test:

```
Watch k6 output:
  ✅ http_req_duration increasing
  ✅ http_req_failed rate appropriate
  ✅ No connection errors
  ✅ VUs ramping as expected
```

### 2. After Test (10-15 minutes):

```
Azure Portal:
  1. Application Insights → Performance
     - See elevated latency during test period
     - P95/P99 should exceed thresholds
  
  2. Application Insights → Failures
     - See error spike during error test
     - Check error rate percentages
  
  3. Monitor → Alerts → Alert history
     - Alerts should show as "Fired"
     - Check fire times match test period
  
  4. Email inbox
     - Verify notifications received
     - Check alert descriptions
```

### 3. Verification Queries (App Insights Logs):

```kql
// Check performance during test
requests
| where timestamp between(datetime('2024-01-01T10:00:00Z') .. datetime('2024-01-01T10:30:00Z'))
| summarize 
    P50 = percentile(duration, 50),
    P95 = percentile(duration, 95),
    P99 = percentile(duration, 99),
    Avg = avg(duration),
    Count = count()
| extend 
    P95_Seconds = P95 / 1000,
    P99_Seconds = P99 / 1000

// Check error rates
requests
| where timestamp between(datetime('2024-01-01T10:00:00Z') .. datetime('2024-01-01T10:30:00Z'))
| summarize 
    Total = count(),
    Failed = countif(success == false),
    Server5xx = countif(resultCode >= 500)
| extend 
    ErrorRate = (Failed * 100.0) / Total,
    Server5xxRate = (Server5xx * 100.0) / Total
```

---

## 🎯 Test Scenarios Matrix

| Test | Duration | VUs | Error Rate | Alerts Triggered | Severity |
|------|----------|-----|------------|------------------|----------|
| **performance-test.js** | 15m | 10→50 | Low | P95, P99, Spike | Error/Warning |
| **error-rate-test.js** | 15m | 20→30 | 10% | 5%, 5xx | Critical/Error |
| **spike-test.js** | 22m | 10→50 | Low | Spike 300% | Warning |

---

## 💡 Pro Tips

### Best Practices:

```
✅ Test during low-traffic periods
✅ Notify team before testing
✅ Start with shorter durations (test connectivity)
✅ Gradually increase load
✅ Monitor Azure portal during test
✅ Keep email client open
✅ Document test results
```

### For Realistic Tests:

```javascript
// Add realistic think time
sleep(Math.random() * 3 + 2);  // 2-5 seconds

// Vary request patterns
const endpoints = ['/api/health', '/api/users', '/api/data'];
const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

// Simulate different user behaviors
if (Math.random() < 0.3) {
  // 30% of users are "power users"
  makeMultipleRequests();
}
```

### Custom Thresholds:

```javascript
export const options = {
  thresholds: {
    'http_req_duration': [
      'p(95)<5000',   // P95 should be < 5s
      'p(99)<10000',  // P99 should be < 10s
    ],
    'http_req_failed': ['rate<0.01'],  // < 1% errors
  },
};
```

---

## 🐛 Troubleshooting

### Connection Errors:

```
Error: "dial: i/o timeout"

Solutions:
  1. Check API_URL is correct and reachable
  2. Verify API is not blocking requests
  3. Check firewall/network settings
  4. Reduce VUs (may be overwhelming API)
```

### High Failure Rate:

```
http_req_failed: 50%+

Solutions:
  1. Check API health: curl $API_URL/api/health
  2. Review API logs for errors
  3. Reduce concurrent VUs
  4. Increase timeouts in script
```

### k6 Not Found:

```
'k6' is not recognized

Solutions:
  1. Reinstall k6
  2. Add k6 to PATH
  3. Use full path: C:\Program Files\k6\k6.exe run test.js
```

### No Alerts Firing:

```
1. Check alert is enabled (Portal)
2. Verify thresholds were actually exceeded
   - Run KQL queries
   - Check k6 metrics output
3. Wait full 15-20 minutes
4. Check action group attached
```

---

## 📊 Comparing with bash Scripts

| Feature | k6 | Bash Scripts |
|---------|----|--------------| 
| **Realism** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Ease of use** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Metrics** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Reporting** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Scalability** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **CI/CD** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Setup** | Requires install | Built-in |

**Recommendation:** Use k6 for comprehensive testing, bash scripts for quick checks.

---

## 🎓 Learning Resources

- **k6 Docs:** https://k6.io/docs/
- **Examples:** https://k6.io/docs/examples/
- **Best Practices:** https://k6.io/docs/testing-guides/
- **API Reference:** https://k6.io/docs/javascript-api/

---

## 🚀 Next Steps

### After k6 Testing:

```
1. ✅ Document test results
2. ✅ Tune alert thresholds if needed
3. ✅ Create runbooks for each alert
4. ✅ Train team on alert responses
5. ✅ Schedule regular testing (quarterly)
6. ✅ Integrate into CI/CD (optional)
```

### CI/CD Integration:

```yaml
# Example: Azure DevOps pipeline
- task: k6@1
  inputs:
    script: 'infrastructure/alerts/k6-tests/performance-test.js'
    envVars: |
      API_URL=$(API_URL)
```

---

## ✅ Quick Command Reference

```bash
# Install k6
choco install k6                # Windows
brew install k6                 # macOS

# Set API URL
$env:API_URL="https://api.com"  # PowerShell
export API_URL="https://api.com" # Bash

# Run tests
k6 run performance-test.js
k6 run error-rate-test.js
k6 run spike-test.js

# Custom parameters
k6 run -e ERROR_RATE=15 error-rate-test.js
k6 run --vus 100 --duration 10m performance-test.js

# Verify
k6 version
```

---

**Happy Load Testing! 🚀📊**

