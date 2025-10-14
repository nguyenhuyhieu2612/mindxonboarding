# Step 6: Validate Production Metrics Setup - Complete Guide

## 📌 Overview

Tài liệu này hướng dẫn chi tiết thực hiện **Step 6: Validate Production Metrics Setup** của Week 2 Part A.

**Mục tiêu**: Xác nhận rằng Application Insights đang thu thập và hiển thị chính xác 4 Golden Signals (Latency, Traffic, Error Rate, Capacity).

**Thời gian ước tính**: 1-2 giờ (bao gồm thời gian chờ data sync)

---

## 🚀 Step 6.1: Generate Test Load

### Cách chạy tests

#### Option 1: Chạy tất cả tests cùng lúc (Recommended)

```powershell
cd k6-tests
.\run-all-validations.ps1
```

**Thời gian**: ~30-35 phút (bao gồm cả thời gian chờ giữa các tests)

#### Option 2: Chạy từng test riêng lẻ

```powershell
# Test 1: Latency (~9 phút)
k6 run validate-latency.js

# Test 2: Traffic (~6 phút)
k6 run validate-traffic.js

# Test 3: Error Rate (~3 phút)
k6 run validate-error-rate.js

# Test 4: Capacity (~10 phút)
k6 run validate-capacity.js
```

### Kết quả mong đợi

Sau khi chạy xong, bạn sẽ thấy output tương tự:

```
✓ P50 Latency: 250ms (Target: <1000ms)
✓ P95 Latency: 1200ms (Target: <2000ms)
✓ P99 Latency: 2800ms (Target: <5000ms)
✓ Total Requests: 10,000+
✓ Average Requests/Second: ~100 req/s
✓ Error Rate: 15-30%
✓ Peak Load: 300 concurrent users
```

---

## ✅ Step 6.2: Verify All Golden Signals

Sau khi chạy tests, đợi **2-5 phút** để data được sync lên Application Insights, rồi thực hiện verification.

### Golden Signal #1: LATENCY

#### Bước 1: Vào Azure Portal

1. Truy cập: https://portal.azure.com
2. Search "Application Insights" hoặc tìm resource group của bạn
3. Click vào App Insights resource của bạn

#### Bước 2: Kiểm tra Performance

1. Menu bên trái → **Performance**
2. Time range: **Last 1 hour**
3. Quan sát biểu đồ response time
4. Kiểm tra các percentiles (P50, P95, P99)

#### Bước 3: Chạy KQL Query

Click **Logs** trong menu bên trái, paste query này:

```kql
requests
| where timestamp > ago(1h)
| summarize 
    P50=percentile(duration, 50),
    P95=percentile(duration, 95),
    P99=percentile(duration, 99),
    AvgDuration=avg(duration),
    RequestCount=count()
| project 
    P50_ms = P50,
    P95_ms = P95,
    P99_ms = P99,
    Avg_ms = AvgDuration,
    TotalRequests = RequestCount
```

#### Bước 4: So sánh kết quả

| Metric | k6 Output | App Insights | ✅ Valid? |
|--------|-----------|--------------|-----------|
| P50 | ~250ms | ? | ±10% OK |
| P95 | ~1200ms | ? | ±10% OK |
| P99 | ~2800ms | ? | ±10% OK |

**Checklist:**
- [ ] P50, P95, P99 metrics xuất hiện trong query results
- [ ] Giá trị App Insights ≈ k6 output (chênh lệch <10%)
- [ ] Performance dashboard hiển thị latency trends
- [ ] Có thể filter latency theo endpoint

---

### Golden Signal #2: TRAFFIC

#### Bước 1: Kiểm tra Metrics

1. Menu bên trái → **Metrics**
2. Metric: Select **Server requests** hoặc **requests/count**
3. Time range: **Last 1 hour**
4. Aggregation: **Count**

#### Bước 2: Chạy KQL Query

```kql
requests
| where timestamp > ago(1h)
| summarize 
    TotalRequests = count(),
    UniqueEndpoints = dcount(name),
    AvgPerMinute = count() / 60.0
| extend 
    AvgPerSecond = AvgPerMinute / 60.0
| project 
    TotalRequests,
    UniqueEndpoints,
    AvgRequestsPerSecond = round(AvgPerSecond, 2)
```

#### Bước 3: Traffic over time

```kql
requests
| where timestamp > ago(1h)
| summarize RequestCount = count() by bin(timestamp, 1m)
| render timechart
```

**Expected**: Sẽ thấy spikes trong các time periods khi bạn chạy tests.

#### Bước 4: So sánh kết quả

| Metric | k6 Output | App Insights | ✅ Valid? |
|--------|-----------|--------------|-----------|
| Total Requests | ~10,000+ | ? | ±5% OK |
| Req/sec (peak) | ~100 | ? | ±10% OK |

**Checklist:**
- [ ] Total request count khớp với k6 output
- [ ] Request rate calculation chính xác
- [ ] Time chart hiển thị traffic patterns rõ ràng
- [ ] Nhận diện được các peak traffic periods

---

### Golden Signal #3: ERROR RATE

#### Bước 1: Kiểm tra Failures

1. Menu bên trái → **Failures**
2. Time range: **Last 1 hour**
3. Xem overview của error types
4. Click vào từng error để xem details

#### Bước 2: Chạy KQL Query

```kql
requests
| where timestamp > ago(1h)
| summarize
    Total = count(),
    Successful = countif(success == true),
    Failed = countif(success == false),
    Error4xx = countif(resultCode >= "400" and resultCode < "500"),
    Error5xx = countif(resultCode >= "500"),
    Error401 = countif(resultCode == "401"),
    Error404 = countif(resultCode == "404"),
    Error500 = countif(resultCode == "500")
| extend 
    SuccessRate = round(100.0 * Successful / Total, 2),
    ErrorRate = round(100.0 * Failed / Total, 2),
    Error4xxRate = round(100.0 * Error4xx / Total, 2),
    Error5xxRate = round(100.0 * Error5xx / Total, 2)
| project 
    Total, 
    Successful, 
    Failed,
    SuccessRate_Percent = SuccessRate,
    ErrorRate_Percent = ErrorRate,
    Error4xx,
    Error5xx,
    Error401,
    Error404,
    Error500
```

#### Bước 3: Error timeline

```kql
requests
| where timestamp > ago(1h)
| where success == false
| summarize ErrorCount = count() by bin(timestamp, 1m), resultCode
| render timechart
```

#### Bước 4: So sánh kết quả

| Metric | k6 Output | App Insights | ✅ Valid? |
|--------|-----------|--------------|-----------|
| Error Rate % | ~15-30% | ? | ±5% OK |
| 4xx Errors | 50+ | ? | ±10% OK |
| 5xx Errors | 20+ | ? | ±10% OK |

**Checklist:**
- [ ] Error percentage khớp với k6
- [ ] 4xx errors được phân loại đúng (401, 404)
- [ ] 5xx errors được phân loại đúng
- [ ] Error details có stack traces
- [ ] Failed dependencies được tracked

---

### Golden Signal #4: CAPACITY

#### Bước 1: Kiểm tra Live Metrics

1. Menu bên trái → **Live Metrics**
2. Nếu có test đang chạy, bạn sẽ thấy real-time data
3. Xem CPU, Memory usage

#### Bước 2: Kiểm tra Performance Counters

1. Menu → **Metrics**
2. Metrics to check:
   - **Process CPU (%)**
   - **Process private bytes** (Memory)
   - **Process working set** (Memory)
   - **Available memory**

#### Bước 3: Chạy KQL Query - CPU Usage

```kql
performanceCounters
| where timestamp > ago(1h)
| where name == "% Processor Time"
| summarize 
    AvgCPU = avg(value),
    MaxCPU = max(value),
    MinCPU = min(value)
    by bin(timestamp, 1m)
| render timechart
```

#### Bước 4: Chạy KQL Query - Memory Usage

```kql
performanceCounters
| where timestamp > ago(1h)
| where name == "Available Bytes" or name == "Private Bytes"
| summarize 
    AvgMemory = avg(value),
    MaxMemory = max(value)
    by bin(timestamp, 1m), name
| render timechart
```

#### Bước 5: Kiểm tra Kubernetes metrics

Mở terminal mới và chạy:

```bash
# Check pod resource usage
kubectl top pods -n mindx-test

# Check node resource usage
kubectl top nodes

# Check pod status
kubectl get pods -n mindx-test

# Check if any pods restarted
kubectl get pods -n mindx-test -o wide
```

#### Bước 6: So sánh patterns

**Checklist:**
- [ ] CPU usage tăng khi load tăng (correlation)
- [ ] Memory usage tăng dưới stress
- [ ] Resource metrics tương ứng với traffic levels
- [ ] Không có pod crashes/restarts bất thường
- [ ] Kubernetes metrics khớp với App Insights data

---

## 🔔 Step 6.3: Test Alert Notifications

Bước này test xem các alerts bạn đã setup có hoạt động không.

### Prerequisite

Bạn cần đã setup alerts trong Step 5. Nếu chưa, xem lại **Step 5: Implement Critical Alerting**.

### Test High Latency Alert

#### Option 1: Sử dụng k6 test có sẵn

Chỉnh sửa `validate-latency.js` để tăng load:

```javascript
// Tạm thời thay đổi stages để trigger alert
export const options = {
  stages: [
    { duration: "2m", target: 100 },  // Tăng lên 100 users nhanh
    { duration: "5m", target: 100 },  // Duy trì cao
  ],
};
```

#### Option 2: Manual trigger bằng script

```powershell
# Stress test to trigger latency alert
k6 run --vus 200 --duration 5m validate-latency.js
```

### Test High Error Rate Alert

Chạy error test với tần suất cao hơn:

```powershell
# Generate high error rate
k6 run --vus 100 --duration 3m validate-error-rate.js
```

### Test Capacity Alert

Chạy capacity test để đẩy CPU/Memory cao:

```powershell
k6 run validate-capacity.js
```

### Verify Alert Notifications

**Checklist:**

- [ ] **Email notifications**
  - Kiểm tra inbox email bạn đã config
  - Email đến trong vòng 5-10 phút sau khi alert trigger
  - Email content có đủ context (metric value, threshold)

- [ ] **Azure Portal notifications**
  - Vào Portal → Monitor → Alerts
  - Xem **Fired Alerts**
  - Kiểm tra alert details

- [ ] **Mobile App** (nếu có)
  - Nhận push notification trên Azure mobile app
  - Notification hiển thị alert severity và details

- [ ] **Alert Resolution**
  - Sau khi condition trở về normal, alert tự động resolve
  - Nhận notification về resolution

### Troubleshooting

**Nếu không nhận được notification:**

1. Kiểm tra Action Group configuration:
   - Portal → Monitor → Action Groups
   - Verify email address đúng
   - Test Action Group bằng "Test" button

2. Kiểm tra Alert Rules:
   - Portal → Monitor → Alerts → Alert rules
   - Verify alert rule enabled
   - Kiểm tra condition thresholds có reasonable không

3. Kiểm tra spam folder
   - Azure emails có thể bị filter vào spam

---

## 📚 Step 6.4: Document Monitoring Setup

Tạo tài liệu tổng hợp về monitoring setup của bạn.

### Tạo file documentation

Tạo file mới: `docs/MONITORING-SETUP.md`

### Template nội dung

```markdown
# Production Monitoring Setup Documentation

**Created**: [Date]
**Author**: [Your Name]
**Environment**: Production (Azure AKS)

---

## 1. Application Insights Configuration

### Resource Details
- **Resource Name**: [your-app-insights-name]
- **Resource Group**: [your-resource-group]
- **Region**: [e.g., Southeast Asia]
- **Instrumentation Key**: `[first 8 chars]...` (stored in KeyVault/Secrets)
- **Connection String**: `InstrumentationKey=[...]` (stored securely)

### Workspace Configuration
- **Log Analytics Workspace**: [workspace-name]
- **Data Retention**: 90 days
- **Daily Cap**: 5 GB/day

---

## 2. Golden Signals Monitoring

### Latency (Signal #1)
- **Metric**: `requests` duration
- **Monitored**: P50, P95, P99 percentiles
- **Baseline Performance**:
  - P50: ~250ms
  - P95: ~1200ms
  - P99: ~2800ms
- **Dashboard**: [Link to Performance dashboard]

### Traffic (Signal #2)
- **Metric**: `requests` count
- **Monitored**: Requests per second, daily active users
- **Baseline Traffic**:
  - Normal: 10-50 req/s
  - Peak: 100+ req/s
- **Dashboard**: [Link to Traffic dashboard]

### Error Rate (Signal #3)
- **Metric**: `requests` success/failure rate
- **Monitored**: Overall error %, 4xx rate, 5xx rate
- **Baseline Error Rate**: <1% under normal conditions
- **Dashboard**: [Link to Failures blade]

### Capacity (Signal #4)
- **Metrics**: CPU %, Memory usage, Pod health
- **Monitored via**:
  - App Insights Performance Counters
  - Kubernetes metrics (kubectl top)
- **Baseline Capacity**:
  - Normal CPU: 10-30%
  - Under load: 50-70%
- **Dashboard**: [Link to Capacity dashboard]

---

## 3. Critical Alerts Configuration

### Alert Rules

#### 1. System Down Alert
- **Name**: `api-availability-critical`
- **Condition**: Availability < 99% for 5 minutes
- **Severity**: Sev 0 (Critical)
- **Action Group**: on-call-engineers
- **Response Time**: Immediate (< 5 min)

#### 2. High Latency Alert
- **Name**: `api-high-latency-warning`
- **Condition**: P95 > 5 seconds for 10 minutes
- **Severity**: Sev 1 (Error)
- **Action Group**: engineering-team
- **Response Time**: 15 minutes

#### 3. High Error Rate Alert
- **Name**: `api-high-error-rate`
- **Condition**: Error rate > 5% for 5 minutes
- **Severity**: Sev 1 (Error)
- **Action Group**: engineering-team
- **Response Time**: 15 minutes

#### 4. High CPU Alert
- **Name**: `api-high-cpu-usage`
- **Condition**: CPU > 80% for 10 minutes
- **Severity**: Sev 2 (Warning)
- **Action Group**: devops-team
- **Response Time**: 30 minutes

### Action Groups

#### on-call-engineers
- **Email**: oncall@company.com
- **SMS**: +84xxxxxxxxx (optional)
- **Azure Mobile App**: Enabled

#### engineering-team
- **Email**: engineering@company.com
- **Webhook**: [Slack/Teams webhook URL]

---

## 4. Dashboard URLs

### Main Dashboards
- **Overview Dashboard**: [Azure Portal URL]
- **Performance Dashboard**: [Azure Portal URL]
- **Failures Dashboard**: [Azure Portal URL]
- **Capacity Dashboard**: [Azure Portal URL]

### Access Instructions
1. Login to Azure Portal: https://portal.azure.com
2. Navigate to Application Insights resource
3. Select appropriate dashboard from menu

### Permissions Required
- Read access to App Insights resource
- Viewer role in resource group

---

## 5. Key Performance Indicators (KPIs)

### Availability
- **Target**: 99.9% uptime
- **Measured**: Last 30 days rolling
- **Current**: [X]%

### Performance
- **Target**: P95 < 2 seconds
- **Measured**: Last 7 days rolling
- **Current**: [X]ms

### Reliability
- **Target**: Error rate < 1%
- **Measured**: Last 7 days rolling
- **Current**: [X]%

### Capacity
- **Target**: CPU < 70% under normal load
- **Measured**: Last 7 days rolling
- **Current**: [X]%

---

## 6. Troubleshooting Common Issues

### No telemetry data in App Insights

**Symptoms**: Dashboard shows no data

**Possible Causes**:
1. Instrumentation key not configured
2. Network firewall blocking telemetry
3. App Insights SDK not initialized

**Resolution**:
```bash
# Check backend logs
kubectl logs -n mindx-test deployment/backend-api --tail=50

# Look for App Insights initialization messages
# Expected: "Application Insights was started successfully"
```

### High latency but low traffic

**Symptoms**: Slow response times with few users

**Investigation**:
1. Check database query performance
2. Check external API dependencies
3. Review Application Map for bottlenecks

### Alerts not firing

**Symptoms**: Conditions met but no notification

**Resolution**:
1. Verify alert rule is enabled
2. Check Action Group configuration
3. Test Action Group manually
4. Check email spam folder

### Missing performance counters

**Symptoms**: CPU/Memory metrics not showing

**Resolution**:
1. Verify App Insights SDK version (use latest)
2. Enable performance counter collection in code
3. Wait 5-10 minutes for sync

---

## 7. Runbook - Alert Response Procedures

### When Availability Alert Fires

**Severity**: Critical (Sev 0)

**Immediate Actions** (within 5 minutes):
1. Check if API is reachable: `curl https://[your-api]/health`
2. Check pod status: `kubectl get pods -n mindx-test`
3. Check recent deployments: `kubectl rollout history deployment/backend-api -n mindx-test`
4. Check application logs for errors

**If API is down**:
- Restart pods: `kubectl rollout restart deployment/backend-api -n mindx-test`
- If no improvement, rollback: `kubectl rollout undo deployment/backend-api -n mindx-test`

**Escalation**: If not resolved in 15 minutes, escalate to senior engineer

### When High Latency Alert Fires

**Severity**: Error (Sev 1)

**Investigation** (within 15 minutes):
1. Check current load: `kubectl top pods -n mindx-test`
2. Review App Insights Application Map for slow dependencies
3. Check database connection pool status
4. Review recent code changes

**Mitigation**:
- If high load: Scale up pods: `kubectl scale deployment/backend-api --replicas=5 -n mindx-test`
- If database slow: Review query performance
- If external API slow: Implement circuit breaker

### When High Error Rate Alert Fires

**Severity**: Error (Sev 1)

**Investigation** (within 15 minutes):
1. Check Failures blade in App Insights
2. Identify which endpoints are failing
3. Review error details and stack traces
4. Check application logs

**Common Causes**:
- Authentication issues (401s)
- Database connection failures
- External API failures
- Code bugs from recent deployment

**Mitigation**:
- If recent deployment: Consider rollback
- If auth issues: Check auth service health
- If database issues: Check connection strings

---

## 8. Validation Test Results

### Test Run: [Date and Time]

#### Latency Test Results
- P50: [X]ms ✅
- P95: [X]ms ✅
- P99: [X]ms ✅
- Status: PASSED

#### Traffic Test Results
- Total Requests: [X]
- Avg req/s: [X]
- Status: PASSED

#### Error Rate Test Results
- Error Rate: [X]%
- 4xx Errors: [X]
- 5xx Errors: [X]
- Status: PASSED

#### Capacity Test Results
- Peak CPU: [X]%
- Peak Memory: [X]MB
- Pod Health: OK
- Status: PASSED

### Overall Validation: ✅ PASSED

---

## 9. Maintenance Schedule

### Daily
- Monitor dashboard for anomalies
- Review critical alerts (if any)

### Weekly
- Review performance trends
- Check capacity planning needs
- Review and update alert thresholds if needed

### Monthly
- Review and optimize KQL queries
- Update documentation
- Review retention policies
- Audit alert effectiveness

---

## 10. Contacts & Support

### On-Call Engineers
- Primary: [Name, Email, Phone]
- Secondary: [Name, Email, Phone]

### DevOps Team
- Team Lead: [Name, Email]
- Team Channel: [Slack/Teams link]

### Azure Support
- Support Plan: [Basic/Standard/Professional Direct]
- Support Portal: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade

---

## Appendix: Useful KQL Queries

### Find slowest endpoints
```kql
requests
| where timestamp > ago(1h)
| summarize AvgDuration=avg(duration), P95=percentile(duration, 95) by name
| order by P95 desc
| take 10
```

### Error analysis by endpoint
```kql
requests
| where timestamp > ago(1h) and success == false
| summarize ErrorCount=count() by name, resultCode
| order by ErrorCount desc
```

### Traffic pattern by hour
```kql
requests
| where timestamp > ago(24h)
| summarize RequestCount=count() by bin(timestamp, 1h)
| render timechart
```

### Resource usage correlation
```kql
performanceCounters
| where timestamp > ago(1h)
| where name == "% Processor Time"
| join kind=inner (
    requests
    | summarize RequestCount=count() by bin(timestamp, 1m)
) on timestamp
| project timestamp, CPU=value, Requests=RequestCount
| render timechart
```
```

---

### Lưu documentation

Sau khi điền đầy đủ thông tin, commit vào repository:

```bash
git add docs/MONITORING-SETUP.md
git commit -m "docs: Add monitoring setup documentation for Week 2 Step 6.4"
git push
```

---

## ✅ Step 6 Completion Checklist

Đánh dấu khi hoàn thành từng item:

### 6.1 Generate Test Load
- [ ] k6 installed and verified
- [ ] Chạy `validate-latency.js` thành công
- [ ] Chạy `validate-traffic.js` thành công
- [ ] Chạy `validate-error-rate.js` thành công
- [ ] Chạy `validate-capacity.js` thành công
- [ ] Có test log files

### 6.2 Verify All Golden Signals
- [ ] **Latency**: P50, P95, P99 visible và match k6 (±10%)
- [ ] **Traffic**: Request count và rate match k6 (±10%)
- [ ] **Error Rate**: Error % và breakdown match k6 (±10%)
- [ ] **Capacity**: CPU/Memory metrics có correlation với load
- [ ] Tất cả KQL queries chạy thành công
- [ ] Dashboards hiển thị đúng data

### 6.3 Test Alert Notifications
- [ ] Triggered ít nhất 1 alert thành công
- [ ] Email notification received
- [ ] Alert details đầy đủ context
- [ ] Alert auto-resolved khi condition cleared
- [ ] Action Groups work cho tất cả channels

### 6.4 Document Monitoring Setup
- [ ] Tạo `MONITORING-SETUP.md` documentation
- [ ] Document App Insights configuration
- [ ] Document các Golden Signals baselines
- [ ] Document alert rules và thresholds
- [ ] Document dashboards URLs
- [ ] Document runbook procedures
- [ ] Document troubleshooting steps
- [ ] Committed và pushed to repository

---

## 📊 Success Criteria

Step 6 được coi là hoàn thành khi:

✅ All 4 k6 validation tests chạy thành công
✅ App Insights data matches k6 results (tolerance ±10%)
✅ All 4 Golden Signals visible và accurate trong dashboards
✅ Ít nhất 1 alert đã được test và notification received
✅ Complete documentation được tạo và committed to repo
✅ Team có thể access dashboards và interpret data
✅ Runbook procedures được document rõ ràng

---

## 🎯 Next Steps After Step 6

Sau khi hoàn thành Step 6, bạn đã có:

1. ✅ Production monitoring hoàn chỉnh với App Insights
2. ✅ 4 Golden Signals được monitor và validate
3. ✅ Critical alerts được config và tested
4. ✅ Documentation đầy đủ cho operations

**Tiếp theo**:
- Chuyển sang **Part B: Product Metrics with Google Analytics**
- Hoặc optimize thêm monitoring setup dựa trên findings

---

**Good luck! 🚀**

