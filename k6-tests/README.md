# k6 Load Testing Suite for Week 2 Validation

This directory contains k6 load testing scripts to validate that Azure Application Insights correctly captures the Four Golden Signals: **Latency, Traffic, Error Rate, and Capacity**.

## 📋 Overview

| Test File | Purpose | Duration | VUs | What It Validates |
|-----------|---------|----------|-----|-------------------|
| `validate-latency.js` | Latency metrics accuracy | ~9 min | 20-50 | P50, P95, P99 response times |
| `validate-traffic.js` | Traffic volume measurement | ~6 min | 100 req/s | Request counts, throughput |
| `validate-error-rate.js` | Error tracking | ~3 min | 10-50 | 4xx, 5xx, timeout errors |
| `validate-capacity.js` | Capacity metrics under load | ~10 min | 10-300 | CPU, Memory, Pod health |

## 🚀 Quick Start

### Prerequisites

1. **Install k6:**
   ```bash
   # Windows (using Chocolatey)
   choco install k6
   
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Verify installation:**
   ```bash
   k6 version
   ```

3. **Set your API URL:**
   ```bash
   # Linux/Mac
   export API_URL=https://your-app.azurewebsites.net
   
   # Windows PowerShell
   $env:API_URL="https://your-app.azurewebsites.net"
   ```

### Running Tests

#### 1. Validate Latency Metrics

Tests P50, P95, P99 latency recording:

```bash
k6 run validate-latency.js
```

**Expected Output:**
```
✓ P50 Latency: 250ms (Target: <1000ms)
✓ P95 Latency: 1200ms (Target: <2000ms)
✓ P99 Latency: 2800ms (Target: <5000ms)
```

**Validation Steps:**
1. Run the test
2. Go to App Insights > Performance
3. Run KQL query:
   ```kusto
   requests
   | where timestamp > ago(10m)
   | summarize 
       P50=percentile(duration, 50),
       P95=percentile(duration, 95),
       P99=percentile(duration, 99)
   ```
4. Compare k6 results with App Insights data

---

#### 2. Validate Traffic Volume

Tests request counting and throughput:

```bash
k6 run validate-traffic.js
```

**Expected Output:**
```
Total Requests: ~10,000+
Average Requests/Second: ~100 req/s
Success Rate: >95%
```

**Validation Steps:**
1. Run the test
2. Go to App Insights > Metrics
3. Select: Server requests
4. Verify request count matches k6 output
5. Run KQL query:
   ```kusto
   requests
   | where timestamp > ago(30m)
   | summarize RequestCount=count() by bin(timestamp, 1m)
   | render timechart
   ```

---

#### 3. Validate Error Rate Tracking

Tests error scenario recording (4xx, 5xx, timeouts):

```bash
k6 run validate-error-rate.js
```

**Expected Output:**
```
Total Errors: 100+
4xx Errors: 50+ (401, 404)
5xx Errors: 20+
Overall Error Rate: 15-30%
```

**Validation Steps:**
1. Run the test
2. Go to App Insights > Failures
3. Verify error counts and types
4. Run KQL query:
   ```kusto
   requests
   | where timestamp > ago(30m)
   | summarize
       Total=count(),
       Errors=countif(success == false),
       ErrorRate=100.0 * countif(success == false) / count(),
       Error4xx=countif(resultCode >= "400" and resultCode < "500"),
       Error5xx=countif(resultCode >= "500")
   ```
5. Compare error rates with k6 results

---

#### 4. Validate Capacity Metrics

Tests CPU, Memory, and resource usage tracking:

```bash
k6 run validate-capacity.js
```

**Expected Output:**
```
Peak Load: 300 concurrent users
CPU/Memory should increase with load
Response time degradation under stress
No pod crashes
```

**Validation Steps:**
1. Run the test
2. Monitor in real-time:
   ```bash
   kubectl top pods -n mindx-test
   kubectl top nodes
   ```
3. Go to App Insights > Metrics
4. Select: Process CPU (%), Available Memory
5. Run KQL queries:
   ```kusto
   // CPU Usage
   performanceCounters
   | where timestamp > ago(30m)
   | where name == "% Processor Time"
   | summarize AvgCPU=avg(value), MaxCPU=max(value) by bin(timestamp, 1m)
   | render timechart
   
   // Memory Usage
   performanceCounters
   | where timestamp > ago(30m)
   | where name == "Available Bytes"
   | summarize AvgMemory=avg(value) by bin(timestamp, 1m)
   | render timechart
   ```
6. Verify resource usage correlates with load stages

---

## 📊 Test Scripts for Automation

### Windows PowerShell

```powershell
# run-validation-tests.ps1

$API_URL = "https://your-app.azurewebsites.net"
$env:API_URL = $API_URL

Write-Host "=== Starting k6 Validation Tests ===" -ForegroundColor Green
Write-Host "API URL: $API_URL" -ForegroundColor Cyan
Write-Host ""

# Test 1: Latency
Write-Host "[1/4] Running Latency Validation..." -ForegroundColor Yellow
k6 run validate-latency.js
Start-Sleep -Seconds 10

# Test 2: Traffic
Write-Host "[2/4] Running Traffic Validation..." -ForegroundColor Yellow
k6 run validate-traffic.js
Start-Sleep -Seconds 10

# Test 3: Error Rate
Write-Host "[3/4] Running Error Rate Validation..." -ForegroundColor Yellow
k6 run validate-error-rate.js
Start-Sleep -Seconds 10

# Test 4: Capacity
Write-Host "[4/4] Running Capacity Validation..." -ForegroundColor Yellow
k6 run validate-capacity.js

Write-Host ""
Write-Host "=== All Validation Tests Completed ===" -ForegroundColor Green
Write-Host "Check Application Insights to verify metrics!" -ForegroundColor Cyan
```

Run with:
```powershell
.\run-validation-tests.ps1
```

### Linux/Mac Bash

```bash
#!/bin/bash
# run-validation-tests.sh

API_URL="https://your-app.azurewebsites.net"
export API_URL

echo "=== Starting k6 Validation Tests ==="
echo "API URL: $API_URL"
echo ""

# Test 1: Latency
echo "[1/4] Running Latency Validation..."
k6 run validate-latency.js
sleep 10

# Test 2: Traffic
echo "[2/4] Running Traffic Validation..."
k6 run validate-traffic.js
sleep 10

# Test 3: Error Rate
echo "[3/4] Running Error Rate Validation..."
k6 run validate-error-rate.js
sleep 10

# Test 4: Capacity
echo "[4/4] Running Capacity Validation..."
k6 run validate-capacity.js

echo ""
echo "=== All Validation Tests Completed ==="
echo "Check Application Insights to verify metrics!"
```

Run with:
```bash
chmod +x run-validation-tests.sh
./run-validation-tests.sh
```

---

## ✅ Validation Checklist

After running all tests, verify in Application Insights:

### Latency (Golden Signal #1)
- [ ] P50, P95, P99 percentiles are recorded
- [ ] Latency values match k6 output (±10%)
- [ ] Performance dashboard shows latency trends
- [ ] Can filter latency by endpoint

### Traffic (Golden Signal #2)
- [ ] Total request count matches k6 output
- [ ] Requests/second calculation is accurate
- [ ] Traffic patterns visible in time charts
- [ ] Peak traffic periods correctly identified

### Error Rate (Golden Signal #3)
- [ ] Error percentage matches k6 output
- [ ] 4xx errors properly categorized
- [ ] 5xx errors properly categorized
- [ ] Error details include stack traces
- [ ] Failed request dependencies tracked

### Capacity (Golden Signal #4)
- [ ] CPU usage increases with load
- [ ] Memory usage tracked accurately
- [ ] Resource metrics correlate with traffic
- [ ] No unexpected pod crashes/restarts
- [ ] Kubernetes metrics match App Insights

---

## 🔍 Troubleshooting

### Test fails immediately
```bash
Error: dial tcp: lookup failed
```
**Solution:** Check API_URL is set and accessible:
```bash
curl $API_URL/health
```

### No data in App Insights
**Possible causes:**
1. Instrumentation key not configured
2. Network firewall blocking telemetry
3. App Insights SDK not initialized
4. Wait 2-3 minutes for data to appear

**Solution:** Check backend logs:
```bash
kubectl logs -n mindx-test deployment/backend-api --tail=50
```

### High error rate during tests
```
Error Rate: 80%+ (Expected: <30%)
```
**Solution:**
- Check if API is healthy: `curl $API_URL/health`
- Reduce VUs in test configuration
- Increase API resources in Kubernetes

### Kubernetes shows high CPU but App Insights doesn't
**Solution:**
- Verify performance counters are enabled in App Insights SDK
- Check if custom metrics collection is configured
- Wait 5-10 minutes for performance counter sync

---

## 📈 Advanced Usage

### Custom Test Duration
```bash
k6 run --duration 5m validate-latency.js
```

### Override VUs
```bash
k6 run --vus 100 --duration 2m validate-traffic.js
```

### Save Results to File
```bash
k6 run --out json=results.json validate-latency.js
```

### Run in Cloud (k6 Cloud)
```bash
k6 cloud validate-latency.js
```

---

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Azure App Insights KQL Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- [Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)

---

## 🎯 Success Criteria

Your monitoring setup is validated when:

1. ✅ All 4 k6 tests complete successfully
2. ✅ App Insights data matches k6 outputs (±10% tolerance)
3. ✅ All 4 Golden Signals visible in dashboards
4. ✅ Error tracking captures different error types
5. ✅ Capacity metrics correlate with load patterns
6. ✅ No data loss or missing telemetry

---

**Next Steps:** After validation, configure alerts based on established baselines from these tests!

