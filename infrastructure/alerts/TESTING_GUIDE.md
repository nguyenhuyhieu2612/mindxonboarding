# Alert Testing Guide

Comprehensive guide for testing all production alerts to verify they work correctly.

## 📋 Testing Overview

### Why Test Alerts?

```
✅ Verify alerts trigger at correct thresholds
✅ Confirm notifications are sent
✅ Validate alert descriptions are clear
✅ Test auto-resolve functionality
✅ Ensure no false positives
✅ Build confidence in monitoring system
```

### Test Categories

| Category | Alerts to Test | Difficulty | Time | Risk |
|----------|----------------|------------|------|------|
| Performance | 3 | Easy | 15 min | Low |
| Error Rate | 3 | Easy | 10 min | Low |
| Capacity | 4 | Medium | 30 min | Medium |
| System Down | 3 | Hard | 15 min | **High** |

---

## 🚀 Test 1: Performance Alerts

### Alerts Being Tested:
- `performance-p99-latency-above-10s`
- `performance-p95-latency-above-5s`
- `performance-avg-spike-300pct`

### Method 1: Load Testing Tool (Recommended)

#### Using Apache Bench:

```bash
# Install if needed
# Ubuntu: sudo apt-get install apache2-utils
# Mac: brew install ab

# Generate 200 requests with 10 concurrent users
# Each request to a slow endpoint
ab -n 200 -c 10 -t 120 \
   https://your-api.azurewebsites.net/api/test-slow?delay=6000

# This should trigger P95 and P99 alerts
```

#### Using our script:

```bash
cd infrastructure/alerts

# Set your API URL
export API_URL="https://your-api.azurewebsites.net"

# Run test
bash test-performance.sh

# Or with custom parameters
NUM_REQUESTS=300 DELAY_MS=7000 bash test-performance.sh
```

### Method 2: Create a Slow Endpoint

If your API doesn't have a test endpoint, create one:

**Backend code (example):**

```typescript
// src/controllers/test.controller.ts
export const testSlowEndpoint = async (req: Request, res: Response) => {
  const delay = parseInt(req.query.delay as string) || 5000;
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  res.json({
    message: 'Slow response',
    delay: delay
  });
};

// src/routes/test.routes.ts
router.get('/test-slow', testSlowEndpoint);
```

### Expected Results:

```
Timeline:
  T+0:     Start sending slow requests
  T+2m:    All requests completed
  T+5m:    Data appears in Application Insights
  T+10m:   Alert evaluation runs
  T+10-15m: Alerts fire if threshold exceeded
  T+15m:   Email notifications sent

Verification:
  1. App Insights → Performance
     - See requests with high duration
     - P95/P99 values should be elevated
  
  2. Alerts → Alert history
     - performance-p99-latency-above-10s: Fired
     - performance-avg-spike-300pct: Fired (maybe)
  
  3. Email
     - Check inbox for alert emails
     - Verify email content is clear
```

### Troubleshooting:

```
Alert didn't fire:
  ☐ Check if enough requests sent (need 20+ for percentiles)
  ☐ Verify delay was sufficient (> 5s for P95, > 10s for P99)
  ☐ Check alert is enabled
  ☐ Wait full 15 minutes
  ☐ Check Application Insights for request data

Alert fired too early:
  ☐ Current baseline might be very low
  ☐ Adjust thresholds or violations setting
```

---

## ❌ Test 2: Error Rate Alerts

### Alerts Being Tested:
- `error-rate-above-5pct`
- `error-rate-5xx-above-1pct`
- `error-rate-critical-endpoints-failing`

### Method 1: Generate Controlled Errors

#### Using our script:

```bash
cd infrastructure/alerts

export API_URL="https://your-api.azurewebsites.net"

# Test with 10% error rate (should trigger both alerts)
ERROR_RATE=10 bash test-error-rate.sh

# Or test with 2% error rate (only triggers 5xx alert)
ERROR_RATE=2 TOTAL_REQUESTS=200 bash test-error-rate.sh
```

### Method 2: Manual Testing

```bash
# Send 100 successful requests
for i in {1..100}; do
  curl -s https://your-api.azurewebsites.net/api/health > /dev/null &
done
wait

# Send 10 error requests (10% error rate)
for i in {1..10}; do
  curl -s -X POST https://your-api.azurewebsites.net/api/test-error \
    -H "Content-Type: application/json" \
    -d '{"code": 500}' > /dev/null &
done
wait
```

### Method 3: Create Test Error Endpoint

```typescript
// Backend test endpoint
export const testErrorEndpoint = async (req: Request, res: Response) => {
  const code = parseInt(req.query.code as string) || 500;
  
  res.status(code).json({
    error: 'Test error',
    code: code
  });
};

// Route
router.get('/test-error', testErrorEndpoint);
```

### Method 4: Test Critical Endpoint Failures

```bash
# Generate failures on critical endpoints
for i in {1..20}; do
  # Try login with invalid credentials (should fail)
  curl -s -X POST https://your-api.azurewebsites.net/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@test.com","password":"wrong"}' > /dev/null &
done
wait
```

### Expected Results:

```
Timeline:
  T+0:     Send mixed successful and error requests
  T+1m:    All requests completed
  T+5m:    Data in Application Insights
  T+10m:   Alert evaluation
  T+10-15m: Alerts fire

Verification:
  1. App Insights → Failures
     - See failed requests
     - Check error rate percentage
  
  2. Run KQL query:
     requests
     | where timestamp > ago(15m)
     | summarize 
         Total = count(),
         Failed = countif(success == false),
         Server5xx = countif(resultCode >= 500 and resultCode < 600)
     | extend 
         ErrorRate = (Failed * 100.0) / Total,
         Server5xxRate = (Server5xx * 100.0) / Total
  
  3. Alerts → Alert history
     - error-rate-above-5pct: Fired (if error rate > 5%)
     - error-rate-5xx-above-1pct: Fired (if 5xx > 1%)
  
  4. Email notifications received
```

---

## 📊 Test 3: Capacity Alerts

### Alerts Being Tested:
- `capacity-cpu-above-80pct`
- `capacity-memory-above-85pct`
- `capacity-disk-below-10pct`
- `capacity-pod-restarts-high`

### Method 1: Stress Test (Recommended)

#### Using our script:

```bash
cd infrastructure/alerts

# Connect to AKS first
az aks get-credentials \
  --resource-group mindx-hieunh01-rg \
  --name mindx-onboarding-aks

# Run stress test
bash test-capacity.sh

# Or with custom parameters
CPU_CORES=3 MEMORY_MB=2000 STRESS_DURATION=600 bash test-capacity.sh
```

### Method 2: Manual Stress Pod

```bash
# Create stress test pod
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: cpu-stress
  namespace: default
spec:
  containers:
  - name: stress
    image: polinux/stress
    resources:
      limits:
        memory: "2Gi"
        cpu: "2"
    command: ["stress"]
    args:
    - "--cpu"
    - "2"
    - "--vm"
    - "1"
    - "--vm-bytes"
    - "1500M"
    - "--timeout"
    - "600s"
  restartPolicy: Never
EOF

# Monitor
kubectl top nodes
kubectl top pod cpu-stress

# Cleanup after test
kubectl delete pod cpu-stress
```

### Method 3: Scale Up Workload

```bash
# Temporarily scale up to create resource pressure
kubectl scale deployment backend --replicas=10

# Monitor
watch kubectl top nodes

# Scale back down
kubectl scale deployment backend --replicas=2
```

### Method 4: Test Pod Restarts

```bash
# Create a pod that crashes and restarts
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: crash-test
  namespace: default
spec:
  containers:
  - name: crash
    image: busybox
    command: ["sh", "-c", "echo 'Starting...'; sleep 10; exit 1"]
  restartPolicy: Always
EOF

# Monitor restarts
watch kubectl get pod crash-test

# Should restart multiple times, triggering alert
# Cleanup
kubectl delete pod crash-test
```

### Expected Results:

```
Timeline:
  T+0:     Deploy stress pod
  T+1m:    CPU/Memory usage increases
  T+5m:    Sustained high usage
  T+10m:   Alert evaluation runs
  T+10-15m: Alerts fire
  T+15m:   Stress test ends
  T+20m:   Auto-resolve (usage back to normal)

Verification:
  1. AKS → Insights → Nodes
     - CPU/Memory graphs show spike
     - Peak should exceed 80%/85%
  
  2. kubectl top nodes
     - Real-time CPU/Memory %
  
  3. Alerts → Alert history
     - capacity-cpu-above-80pct: Fired
     - capacity-memory-above-85pct: Fired (maybe)
  
  4. Email notifications
```

### Safety Notes:

```
⚠️  Capacity testing creates real load!

Precautions:
  ✅ Test during low-traffic periods
  ✅ Monitor cluster health continuously
  ✅ Have kubectl ready to kill pods
  ✅ Set reasonable stress limits
  ✅ Alert team before testing

Emergency stop:
  kubectl delete pods -l app=stress-test
  kubectl delete pod cpu-stress
```

---

## 🚨 Test 4: System Down Alerts (Use with Caution!)

### Alerts Being Tested:
- `system-down-availability-below-99`
- `system-down-zero-successful-requests`
- `system-down-healthcheck-failing`

### ⚠️ WARNING:

```
🚨 This test simulates ACTUAL downtime!

Only test if:
  ✅ Non-production environment
  ✅ During scheduled maintenance window
  ✅ Team is informed
  ✅ Users are notified (if prod)
  ✅ Rollback plan ready
```

### Method 1: Scale to Zero (Safest)

```bash
# Scale backend to 0 replicas
kubectl scale deployment backend --replicas=0 -n default

# Wait 5-10 minutes for alerts to fire

# Restore
kubectl scale deployment backend --replicas=2 -n default
```

### Method 2: Network Policy (Advanced)

```bash
# Block all ingress traffic
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
EOF

# Wait for alerts

# Remove policy
kubectl delete networkpolicy deny-all-ingress -n default
```

### Method 3: Stop Availability Test

```
In Azure Portal:
  1. App Insights → Availability
  2. Click your availability test
  3. Click "Disable"
  4. Wait 10 minutes
  5. Re-enable
```

### Expected Results:

```
Timeline:
  T+0:     Simulate downtime
  T+1m:    Requests start failing
  T+5m:    Zero successful requests for 5 minutes
  T+5-10m: Alerts fire
  T+10m:   Restore service
  T+15m:   Auto-resolve

Verification:
  1. App Insights → Failures
     - Should show 100% failure rate
  
  2. Availability tab
     - Should show test failures
  
  3. Alerts fired:
     - system-down-zero-successful-requests
     - system-down-availability-below-99
  
  4. Critical emails received
```

---

## ✅ Comprehensive Test Plan

### Full Testing Schedule:

```
Week 1: Setup & Individual Tests
  Day 1: Create test endpoints
  Day 2: Test performance alerts
  Day 3: Test error rate alerts
  Day 4: Test capacity alerts
  Day 5: Review results & tune

Week 2: Integration & System Tests
  Day 1: Test system down alerts (maintenance window)
  Day 2: Test all alerts together
  Day 3: Verify auto-resolve
  Day 4: Test notification channels
  Day 5: Final tuning & documentation
```

### Testing Checklist:

```
Before Testing:
  ☐ All alerts created and enabled
  ☐ Action groups configured
  ☐ Test endpoints deployed (if needed)
  ☐ Team notified of testing
  ☐ Monitoring tools ready

For Each Alert:
  ☐ Trigger condition met
  ☐ Alert fires within expected time
  ☐ Email notification received
  ☐ Email content is clear and actionable
  ☐ Alert auto-resolves when condition clears
  ☐ No false positives
  ☐ Threshold is appropriate

After Testing:
  ☐ Document actual vs expected behavior
  ☐ Adjust thresholds if needed
  ☐ Update runbooks
  ☐ Train team on alert responses
  ☐ Schedule regular testing (quarterly)
```

---

## 📊 Verification Queries

### Check Performance Alert Data:

```kql
requests
| where timestamp > ago(30m)
| summarize 
    P50 = percentile(duration, 50),
    P95 = percentile(duration, 95),
    P99 = percentile(duration, 99),
    Avg = avg(duration)
| extend 
    P95_Seconds = P95 / 1000,
    P99_Seconds = P99 / 1000
```

### Check Error Rate:

```kql
requests
| where timestamp > ago(30m)
| summarize 
    Total = count(),
    Failed = countif(success == false),
    Server5xx = countif(resultCode >= 500 and resultCode < 600)
| extend 
    ErrorRate = (Failed * 100.0) / Total,
    Server5xxRate = (Server5xx * 100.0) / Total
```

### Check Capacity Metrics:

```kql
Perf
| where TimeGenerated > ago(30m)
| where ObjectName == "K8SNode"
| where CounterName == "cpuUsagePercentage" or CounterName == "memoryWorkingSetPercentage"
| summarize AvgValue = avg(CounterValue) by Computer, CounterName, bin(TimeGenerated, 5m)
| render timechart
```

### Check Alert History:

```bash
# Via Azure CLI
az monitor activity-log list \
  --resource-group mindx-hieunh01-rg \
  --max-events 50 \
  --query "[?contains(category, 'Alert')]" \
  --output table
```

---

## 🔧 Troubleshooting

### Alert Didn't Fire:

```
1. Check alert is enabled:
   Alerts → Alert rules → Status = Enabled
   
2. Verify condition was met:
   Run KQL queries to check actual values
   
3. Check evaluation frequency:
   May need to wait longer (2x frequency)
   
4. Review alert logic:
   Violations setting might be too strict
   
5. Check action group:
   Ensure it's attached and configured
```

### Alert Fired Too Early:

```
1. Check baseline data:
   Current values may be normally high
   
2. Adjust threshold:
   Increase value (e.g., 80% → 90%)
   
3. Increase violations:
   1 violation → 2 violations
   
4. Increase evaluation period:
   5 minutes → 10 minutes
```

### No Email Received:

```
1. Check spam folder
   
2. Verify email in action group:
   Action groups → AG_PROD_* → Notifications
   
3. Check action group status:
   Should show "Email verified"
   
4. Test action group:
   Action groups → Test → Send test notification
```

### False Positives:

```
Common causes:
  • Thresholds too sensitive
  • Normal traffic spikes
  • Maintenance activities
  • Testing/dev traffic
  
Solutions:
  • Tune thresholds
  • Add time-based filters
  • Increase violations requirement
  • Filter out test requests in queries
```

---

## 📚 Best Practices

### Testing Frequency:

```
Immediate:
  - After creating new alerts
  - After modifying alert logic
  - After infrastructure changes

Regular:
  - Monthly: Spot check random alerts
  - Quarterly: Full alert test suite
  - Annually: Complete system review

After Incidents:
  - Verify alerts fired correctly
  - Test any alert that didn't fire
  - Review and tune if needed
```

### Documentation:

```
For each test, document:
  ✅ Date and time
  ✅ Alerts tested
  ✅ Test method used
  ✅ Expected vs actual results
  ✅ Issues found
  ✅ Adjustments made
  ✅ Team members involved
```

### Safety:

```
Always:
  ✅ Test in non-production first
  ✅ Have rollback plan ready
  ✅ Monitor during tests
  ✅ Notify team before testing
  ✅ Test during low-traffic periods
  ✅ Keep test duration short
  ✅ Clean up test resources
```

---

## 🎯 Success Criteria

An alert is properly configured if:

```
✅ Fires within expected time (10-15 min)
✅ Email notification is received
✅ Alert description is clear and actionable
✅ Auto-resolves when condition clears
✅ No false positives during normal operation
✅ Team knows how to respond
✅ Threshold is appropriate for your app
```

---

## 📞 Support

If you encounter issues:

1. **Review this guide** for troubleshooting steps
2. **Check Azure Monitor docs** for signal-specific info
3. **Review KQL queries** to verify data is being collected
4. **Test action groups** independently
5. **Contact Azure Support** if infrastructure issues

---

**Happy Testing! 🚀**

Remember: Testing alerts is as important as creating them!

