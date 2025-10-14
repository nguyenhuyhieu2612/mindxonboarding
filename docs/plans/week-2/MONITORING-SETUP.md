# Production Monitoring Setup Documentation

**Created**: [TODO: Add date after Step 6 completion]
**Author**: HuyNQ
**Environment**: Production (Azure AKS)
**Status**: 🚧 In Progress - Week 2 Step 6

---

## 1. Application Insights Configuration

### Resource Details
- **Resource Name**: `[TODO: Fill in your App Insights resource name]`
- **Resource Group**: `[TODO: Fill in your resource group]`
- **Region**: `[TODO: e.g., Southeast Asia]`
- **Instrumentation Key**: `[TODO: First 8 chars]...` (full key stored in KeyVault/Secrets)
- **Connection String**: (stored securely in Kubernetes secrets)

### Workspace Configuration
- **Log Analytics Workspace**: `[TODO: workspace-name]`
- **Data Retention**: [TODO: e.g., 90 days]
- **Daily Cap**: [TODO: e.g., 5 GB/day]

---

## 2. Golden Signals Monitoring

### Latency (Signal #1)

**What we monitor**: Response time for all API endpoints

- **Metric**: `requests` duration field
- **Key Percentiles**:
  - P50 (median): [TODO: Fill after validation test]
  - P95: [TODO: Fill after validation test]
  - P99: [TODO: Fill after validation test]

**Dashboard Location**: Azure Portal → App Insights → Performance

**KQL Query**:
```kql
requests
| where timestamp > ago(1h)
| summarize 
    P50=percentile(duration, 50),
    P95=percentile(duration, 95),
    P99=percentile(duration, 99)
```

---

### Traffic (Signal #2)

**What we monitor**: Request volume and throughput

- **Metric**: `requests` count
- **Baseline Traffic**:
  - Normal: [TODO: Fill after validation test] req/s
  - Peak: [TODO: Fill after validation test] req/s
  - Daily Active Users: [TODO: Fill after validation test]

**Dashboard Location**: Azure Portal → App Insights → Metrics → Server requests

**KQL Query**:
```kql
requests
| where timestamp > ago(1h)
| summarize RequestCount=count() by bin(timestamp, 1m)
| render timechart
```

---

### Error Rate (Signal #3)

**What we monitor**: Failed requests and error types

- **Metric**: `requests` success/failure rate
- **Baseline Error Rate**: [TODO: Fill after validation test]%
- **Error Breakdown**:
  - 4xx (Client Errors): [TODO: Fill after validation test]%
  - 5xx (Server Errors): [TODO: Fill after validation test]%

**Dashboard Location**: Azure Portal → App Insights → Failures

**KQL Query**:
```kql
requests
| where timestamp > ago(1h)
| summarize
    Total=count(),
    Failed=countif(success == false),
    ErrorRate=100.0 * countif(success == false) / count(),
    Error4xx=countif(resultCode >= "400" and resultCode < "500"),
    Error5xx=countif(resultCode >= "500")
```

---

### Capacity (Signal #4)

**What we monitor**: System resources under load

- **Metrics**: 
  - CPU Usage (%)
  - Memory Usage (MB)
  - Pod Health
  
- **Baseline Capacity**:
  - Normal CPU: [TODO: Fill after validation test]%
  - Under Load CPU: [TODO: Fill after validation test]%
  - Normal Memory: [TODO: Fill after validation test] MB
  - Under Load Memory: [TODO: Fill after validation test] MB

**Dashboard Location**: 
- App Insights → Metrics → Process CPU / Available Memory
- Live Metrics for real-time view

**KQL Queries**:
```kql
// CPU Usage
performanceCounters
| where timestamp > ago(1h)
| where name == "% Processor Time"
| summarize AvgCPU=avg(value), MaxCPU=max(value) by bin(timestamp, 1m)
| render timechart

// Memory Usage
performanceCounters
| where timestamp > ago(1h)
| where name == "Available Bytes"
| summarize AvgMemory=avg(value) by bin(timestamp, 1m)
| render timechart
```

---

## 3. Critical Alerts Configuration

### Alert Rules

> [TODO: Fill in after completing Step 5 - Implement Critical Alerting]

#### 1. System Down Alert
- **Name**: `[TODO: alert-rule-name]`
- **Condition**: Availability < 99% for 5 minutes
- **Severity**: Sev 0 (Critical)
- **Action Group**: `[TODO: action-group-name]`
- **Status**: [TODO: ✅ Configured | ⏳ Pending]

#### 2. High Latency Alert
- **Name**: `[TODO: alert-rule-name]`
- **Condition**: P95 latency > 5 seconds for 10 minutes
- **Severity**: Sev 1 (Error)
- **Action Group**: `[TODO: action-group-name]`
- **Status**: [TODO: ✅ Configured | ⏳ Pending]

#### 3. High Error Rate Alert
- **Name**: `[TODO: alert-rule-name]`
- **Condition**: Error rate > 5% for 5 minutes
- **Severity**: Sev 1 (Error)
- **Action Group**: `[TODO: action-group-name]`
- **Status**: [TODO: ✅ Configured | ⏳ Pending]

#### 4. High CPU Alert
- **Name**: `[TODO: alert-rule-name]`
- **Condition**: CPU > 80% for 10 minutes
- **Severity**: Sev 2 (Warning)
- **Action Group**: `[TODO: action-group-name]`
- **Status**: [TODO: ✅ Configured | ⏳ Pending]

### Action Groups

> [TODO: Fill in your Action Groups]

#### Primary Action Group
- **Name**: `[TODO: action-group-name]`
- **Email**: `[TODO: your-email@domain.com]`
- **SMS** (optional): `[TODO: phone-number]`
- **Azure Mobile App**: [TODO: ✅ Enabled | ❌ Disabled]

---

## 4. Dashboard URLs

> [TODO: Fill in after creating dashboards in Azure Portal]

### Main Dashboards
- **Overview Dashboard**: `[TODO: Azure Portal URL]`
- **Performance Dashboard**: `[TODO: Azure Portal URL]`
- **Failures Dashboard**: `[TODO: Azure Portal URL]`
- **Live Metrics**: `[TODO: Azure Portal URL]`

### Access Instructions
1. Login to Azure Portal: https://portal.azure.com
2. Search for Application Insights
3. Select resource: `[TODO: your-app-insights-name]`
4. Navigate to appropriate section from left menu

---

## 5. Validation Test Results

### Test Run Information
- **Date**: `[TODO: Fill after running Step 6.1 tests]`
- **Time**: `[TODO: Time of test execution]`
- **Duration**: ~30-35 minutes (all 4 tests)
- **k6 Version**: v1.3.0

### Test #1: Latency Validation

**Test Duration**: ~9 minutes

| Metric | k6 Result | App Insights | Difference | Status |
|--------|-----------|--------------|------------|--------|
| P50 (ms) | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| P95 (ms) | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| P99 (ms) | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |

**Notes**: [TODO: Add any observations]

---

### Test #2: Traffic Validation

**Test Duration**: ~6 minutes

| Metric | k6 Result | App Insights | Difference | Status |
|--------|-----------|--------------|------------|--------|
| Total Requests | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| Avg req/s | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| Peak req/s | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |

**Notes**: [TODO: Add any observations]

---

### Test #3: Error Rate Validation

**Test Duration**: ~3 minutes

| Metric | k6 Result | App Insights | Difference | Status |
|--------|-----------|--------------|------------|--------|
| Total Errors | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| Error Rate % | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| 4xx Errors | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| 5xx Errors | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |

**Notes**: [TODO: Add any observations]

---

### Test #4: Capacity Validation

**Test Duration**: ~10 minutes

| Metric | k6 Result | Kubernetes | App Insights | Status |
|--------|-----------|------------|--------------|--------|
| Peak CPU % | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| Peak Memory (MB) | [TODO] | [TODO] | [TODO] | [TODO: ✅/❌] |
| Pod Restarts | - | [TODO] | - | [TODO: ✅/❌] |

**Notes**: [TODO: Add any observations]

---

### Overall Validation Status

- [ ] All 4 tests completed successfully
- [ ] App Insights data matches k6 results (±10% tolerance)
- [ ] All Golden Signals visible in dashboards
- [ ] No unexpected errors or crashes

**Overall Result**: [TODO: ✅ PASSED | ❌ FAILED | ⚠️ PARTIAL]

---

## 6. Troubleshooting Common Issues

### Issue: No telemetry data in App Insights

**Symptoms**: Dashboard shows no data or very little data

**Possible Causes**:
1. Instrumentation key not configured correctly
2. Network/firewall blocking telemetry
3. App Insights SDK not initialized properly
4. Application not generating requests

**Resolution Steps**:

```bash
# 1. Check backend pod logs for App Insights initialization
kubectl logs -n mindx-test deployment/backend-api --tail=100

# Look for: "ApplicationInsights: Instrumentation key set to..."

# 2. Verify environment variable is set
kubectl get deployment backend-api -n mindx-test -o yaml | grep -A 5 APPINSIGHTS

# 3. Check if pods are running
kubectl get pods -n mindx-test

# 4. Verify API is receiving requests
curl https://hieunh01.mindx.edu.vn/health
```

**Expected**: Should see App Insights initialization messages in logs

---

### Issue: Alerts not firing

**Symptoms**: Conditions are met but no notifications received

**Resolution Steps**:

1. **Check Alert Rule Status**
   - Go to Azure Portal → Monitor → Alerts → Alert rules
   - Find your alert rule
   - Verify it's **Enabled**

2. **Check Alert Conditions**
   - Click on alert rule
   - Review condition query and threshold
   - Verify time aggregation window

3. **Test Action Group**
   - Portal → Monitor → Action Groups
   - Select your action group
   - Click "Test" button
   - Should receive test notification

4. **Check Email Spam Folder**
   - Azure alert emails might be filtered

5. **Check Fired Alerts**
   - Portal → Monitor → Alerts
   - Filter by time range when condition was met
   - See if alert appears in history

---

### Issue: High latency in tests

**Symptoms**: P95/P99 latency much higher than expected

**Investigation Steps**:

```bash
# 1. Check pod resource usage
kubectl top pods -n mindx-test

# 2. Check pod status
kubectl describe pod -n mindx-test -l app=backend-api

# 3. Check recent events
kubectl get events -n mindx-test --sort-by='.lastTimestamp'

# 4. Check application logs for errors
kubectl logs -n mindx-test deployment/backend-api --tail=200
```

**Common Causes**:
- Insufficient pod resources (CPU/Memory limits too low)
- Database connection pool exhausted
- External API dependencies slow
- Cold start issues

**Solutions**:
- Increase resource limits in deployment
- Optimize database queries
- Implement caching
- Scale up replicas

---

### Issue: Missing performance counters

**Symptoms**: CPU/Memory metrics not showing in App Insights

**Possible Causes**:
1. Performance counter collection not enabled
2. Old version of App Insights SDK
3. Data takes time to sync (5-10 minutes)

**Resolution**:

1. **Check SDK version in package.json**
   ```bash
   cat backend/package.json | grep applicationinsights
   ```
   Should be: `"applicationinsights": "^2.9.0"` or higher

2. **Verify performance counter configuration in code**
   Check `backend/src/config/app-insights.ts`

3. **Wait for data sync**
   Performance counters may take 5-10 minutes to appear

4. **Use Live Metrics for real-time view**
   Portal → App Insights → Live Metrics

---

## 7. Runbook - Alert Response Procedures

### 🚨 When System Down Alert Fires (Sev 0)

**Severity**: CRITICAL - Immediate response required

**Response Time Target**: < 5 minutes

**Immediate Actions**:

1. **Verify the issue** (1-2 min)
   ```bash
   # Check if API is reachable
   curl https://hieunh01.mindx.edu.vn/health
   
   # Check pod status
   kubectl get pods -n mindx-test
   
   # Check pod events
   kubectl get events -n mindx-test --sort-by='.lastTimestamp' | head -20
   ```

2. **If pods are not running**:
   ```bash
   # Check why pods are down
   kubectl describe pod -n mindx-test -l app=backend-api
   
   # Restart deployment
   kubectl rollout restart deployment/backend-api -n mindx-test
   
   # Watch pod startup
   kubectl get pods -n mindx-test -w
   ```

3. **If pods are running but not responding**:
   ```bash
   # Check application logs
   kubectl logs -n mindx-test deployment/backend-api --tail=100
   
   # If needed, scale down and up to force restart
   kubectl scale deployment/backend-api --replicas=0 -n mindx-test
   kubectl scale deployment/backend-api --replicas=3 -n mindx-test
   ```

4. **If issue persists - Rollback recent deployment**:
   ```bash
   # Check deployment history
   kubectl rollout history deployment/backend-api -n mindx-test
   
   # Rollback to previous version
   kubectl rollout undo deployment/backend-api -n mindx-test
   
   # Verify rollback
   kubectl rollout status deployment/backend-api -n mindx-test
   ```

**Escalation**: If not resolved in 15 minutes, escalate to senior engineer

**Post-Incident**: Document root cause and create post-mortem

---

### ⚠️ When High Latency Alert Fires (Sev 1)

**Severity**: ERROR

**Response Time Target**: < 15 minutes

**Investigation Steps**:

1. **Check current load**:
   ```bash
   kubectl top pods -n mindx-test
   kubectl top nodes
   ```

2. **Review App Insights Application Map**:
   - Portal → App Insights → Application Map
   - Identify slow dependencies

3. **Check recent deployments**:
   ```bash
   kubectl rollout history deployment/backend-api -n mindx-test
   ```

**Mitigation Actions**:

- **If high CPU/Memory**:
  ```bash
  # Scale up pods
  kubectl scale deployment/backend-api --replicas=5 -n mindx-test
  ```

- **If database slow**:
  - Review slow query logs
  - Check database connection pool
  - Consider adding indexes

- **If external API slow**:
  - Check Application Map for dependency issues
  - Implement circuit breaker if needed
  - Add timeout configuration

---

### ⚠️ When High Error Rate Alert Fires (Sev 1)

**Severity**: ERROR

**Response Time Target**: < 15 minutes

**Investigation Steps**:

1. **Check Failures blade**:
   - Portal → App Insights → Failures
   - Identify which endpoints failing
   - Review error details and stack traces

2. **Check application logs**:
   ```bash
   kubectl logs -n mindx-test deployment/backend-api --tail=500 | grep -i error
   ```

3. **Run error analysis query**:
   ```kql
   requests
   | where timestamp > ago(30m) and success == false
   | summarize ErrorCount=count() by name, resultCode
   | order by ErrorCount desc
   ```

**Common Causes & Solutions**:

- **401 Errors (Authentication)**:
  - Check auth service health
  - Verify JWT tokens not expired
  - Check auth configuration

- **404 Errors (Not Found)**:
  - Check if endpoints changed in recent deployment
  - Verify routing configuration

- **500 Errors (Server)**:
  - Check application logs for exceptions
  - If recent deployment, consider rollback
  - Check database connectivity

- **503 Errors (Service Unavailable)**:
  - Check if pods are overloaded
  - Scale up replicas
  - Check resource limits

---

## 8. Useful KQL Queries

### 📊 Performance Analysis

#### Find slowest endpoints
```kql
requests
| where timestamp > ago(1h)
| summarize 
    Count=count(),
    AvgDuration=avg(duration), 
    P95=percentile(duration, 95),
    P99=percentile(duration, 99)
    by name
| order by P95 desc
| take 10
```

#### Response time trend
```kql
requests
| where timestamp > ago(24h)
| summarize 
    P50=percentile(duration, 50),
    P95=percentile(duration, 95)
    by bin(timestamp, 1h)
| render timechart
```

---

### 🚨 Error Analysis

#### Error breakdown by type
```kql
requests
| where timestamp > ago(1h) and success == false
| summarize ErrorCount=count() by name, resultCode
| order by ErrorCount desc
```

#### Error rate over time
```kql
requests
| where timestamp > ago(24h)
| summarize 
    Total=count(),
    Errors=countif(success == false),
    ErrorRate=100.0 * countif(success == false) / count()
    by bin(timestamp, 1h)
| render timechart
```

#### Top error messages
```kql
exceptions
| where timestamp > ago(1h)
| summarize Count=count() by outerMessage
| order by Count desc
| take 10
```

---

### 📈 Traffic Analysis

#### Requests per minute
```kql
requests
| where timestamp > ago(1h)
| summarize RequestCount=count() by bin(timestamp, 1m)
| render timechart
```

#### Top endpoints by volume
```kql
requests
| where timestamp > ago(24h)
| summarize RequestCount=count() by name
| order by RequestCount desc
| take 10
```

#### User activity (by session)
```kql
requests
| where timestamp > ago(24h)
| summarize Sessions=dcount(session_Id), Requests=count()
| project Sessions, Requests, AvgRequestsPerSession = Requests / Sessions
```

---

### 💻 Capacity Analysis

#### CPU usage over time
```kql
performanceCounters
| where timestamp > ago(1h)
| where name == "% Processor Time"
| summarize 
    AvgCPU=avg(value),
    MaxCPU=max(value),
    MinCPU=min(value)
    by bin(timestamp, 1m)
| render timechart
```

#### Memory usage over time
```kql
performanceCounters
| where timestamp > ago(1h)
| where name == "Available Bytes" or name == "Private Bytes"
| summarize AvgValue=avg(value) by bin(timestamp, 1m), name
| render timechart
```

#### Correlation: Requests vs CPU
```kql
let cpu = performanceCounters
| where timestamp > ago(1h)
| where name == "% Processor Time"
| summarize CPU=avg(value) by bin(timestamp, 1m);
let reqs = requests
| where timestamp > ago(1h)
| summarize Requests=count() by bin(timestamp, 1m);
cpu
| join kind=inner reqs on timestamp
| project timestamp, CPU, Requests
| render timechart
```

---

## 9. Maintenance Schedule

### Daily Tasks
- [ ] Review dashboards for anomalies (5 min)
- [ ] Check for any fired alerts in last 24h
- [ ] Verify all services healthy

### Weekly Tasks
- [ ] Review performance trends (20 min)
- [ ] Analyze error patterns
- [ ] Check capacity planning needs
- [ ] Update alert thresholds if needed

### Monthly Tasks
- [ ] Full monitoring review (1 hour)
- [ ] Update documentation
- [ ] Review and optimize KQL queries
- [ ] Audit alert effectiveness
- [ ] Review retention policies and costs

---

## 10. Contacts & Support

### Team Contacts

**On-Call Engineers**
- Primary: `[TODO: Name, Email, Phone]`
- Secondary: `[TODO: Name, Email, Phone]`

**DevOps Team**
- Team Lead: `[TODO: Name, Email]`
- Team Channel: `[TODO: Slack/Teams link]`

**Application Team**
- Tech Lead: `[TODO: Name, Email]`
- Developers: `[TODO: Names]`

### Support Resources

**Azure Support**
- Support Portal: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- Support Plan: `[TODO: Basic/Standard/Professional Direct]`

**Documentation**
- Azure App Insights Docs: https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview
- KQL Reference: https://docs.microsoft.com/azure/data-explorer/kusto/query/
- k6 Load Testing Docs: https://k6.io/docs/

**Internal Resources**
- Wiki: `[TODO: Internal wiki link]`
- Runbooks: `[TODO: Runbook location]`
- Architecture Docs: See `/docs` folder in repository

---

## 📝 Document History

| Date | Author | Changes |
|------|--------|---------|
| [TODO] | HuyNQ | Initial creation (Week 2 Step 6.4) |
| [TODO] | [Name] | Added validation test results |
| [TODO] | [Name] | Updated alert configurations |

---

## ✅ Step 6.4 Checklist

- [ ] All TODOs in this document filled out
- [ ] Validation test results documented
- [ ] Alert configurations documented
- [ ] Dashboard URLs added
- [ ] Runbook procedures reviewed
- [ ] Contact information added
- [ ] Document committed to repository
- [ ] Team has access to this documentation

---

**Last Updated**: [TODO: Add date]
**Status**: 🚧 Draft | Ready for Review | ✅ Approved

