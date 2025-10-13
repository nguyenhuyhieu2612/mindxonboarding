# Alert Testing Suite

Quick start guide for testing all production alerts.

## 📁 Files Overview

```
infrastructure/alerts/
├── TESTING_GUIDE.md              # Comprehensive testing guide
├── TESTING_README.md             # This file - quick start
│
├── test-alerts.sh                # Interactive test menu (all tests)
├── test-performance.sh           # Performance/latency alerts
├── test-error-rate.sh            # Error rate alerts  
├── test-capacity.sh              # Capacity/infrastructure alerts
├── test-notifications.sh         # Test action group notifications
│
├── CAPACITY_ALERTS_GUIDE.md      # Capacity alert setup
├── CAPACITY_QUICKSTART.md        # Quick capacity alert creation
├── PORTAL_SETUP_GUIDE.md         # Portal setup for system down alerts
├── PERFORMANCE_ALERTS_GUIDE.md   # Performance alert setup
└── ALERTS_SUMMARY.md             # Complete alert overview
```

---

## 🚀 Quick Start

### Prerequisites:

```bash
# 1. Install required tools
# - Azure CLI: az --version
# - kubectl: kubectl version
# - curl: curl --version

# 2. Connect to Azure
az login
az account set --subscription "MindX Develop Azure Subscription"

# 3. Connect to AKS (for capacity tests)
az aks get-credentials \
  --resource-group mindx-hieunh01-rg \
  --name mindx-onboarding-aks

# 4. Set your API URL
export API_URL="https://your-api.azurewebsites.net"
```

---

## 🎯 Testing Methods

### Method 1: Interactive Menu (Easiest)

```bash
cd infrastructure/alerts
bash test-alerts.sh

# Follow the menu:
# 1) Test Performance Alerts
# 2) Test Error Rate Alerts
# 3) Test Capacity Alerts
# 4) Test System Down Alerts (⚠️ Caution!)
# 5) Run All Tests
# 6) View Alert History
```

### Method 2: Individual Scripts

```bash
# Test notifications first
bash test-notifications.sh

# Then test each category
bash test-performance.sh
bash test-error-rate.sh
bash test-capacity.sh
```

### Method 3: Manual Portal Testing

```
See TESTING_GUIDE.md for detailed manual testing procedures
```

---

## 📊 Test Each Alert Type

### 1️⃣ Performance Alerts (15 minutes)

**What it tests:**
- P99 latency > 10s
- P95 latency > 5s  
- Response time spike > 300%

**Quick test:**
```bash
export API_URL="https://your-api.azurewebsites.net"
bash test-performance.sh
```

**Verification:**
```
✅ App Insights → Performance (see elevated latency)
✅ Alerts → Alert history (check for fired alerts)
✅ Email inbox (verify notifications)
```

---

### 2️⃣ Error Rate Alerts (10 minutes)

**What it tests:**
- Overall error rate > 5%
- 5xx error rate > 1%
- Critical endpoint failures

**Quick test:**
```bash
export API_URL="https://your-api.azurewebsites.net"
ERROR_RATE=10 bash test-error-rate.sh
```

**Verification:**
```
✅ App Insights → Failures (see error spike)
✅ Run KQL query to check error percentages
✅ Alerts fired (check history)
```

---

### 3️⃣ Capacity Alerts (30 minutes)

**What it tests:**
- CPU > 80%
- Memory > 85%
- Disk < 10% free
- Pod restarts high

**Quick test:**
```bash
bash test-capacity.sh
```

**Verification:**
```
✅ AKS → Insights → Nodes (see resource spike)
✅ kubectl top nodes (real-time usage)
✅ Alerts fired for capacity issues
```

**Safety:**
- Creates temporary load on cluster
- Automatically cleans up after test
- Monitor during test

---

### 4️⃣ System Down Alerts (15 minutes)

**⚠️ WARNING: Simulates actual downtime!**

**What it tests:**
- Availability < 99%
- Zero successful requests
- Health checks failing

**Test method:**
```bash
# Scale backend to 0 (safest method)
kubectl scale deployment backend --replicas=0

# Wait 5-10 minutes

# Restore
kubectl scale deployment backend --replicas=2
```

**Only test if:**
- ✅ Non-production environment
- ✅ Scheduled maintenance window
- ✅ Team notified
- ✅ Ready to restore immediately

---

## ✅ Expected Timeline

For each alert test:

```
T+0:     Trigger condition (send requests, deploy stress pod, etc.)
T+2m:    Complete test actions
T+5m:    Data appears in Application Insights / AKS metrics
T+10m:   Alert evaluation runs
T+10-15m: Alert fires (if threshold exceeded)
T+15m:   Email notification received
T+20m+:  Alert auto-resolves (when condition clears)
```

**Total verification time: ~15-20 minutes per test**

---

## 📧 Test Notifications

Before running full tests, verify notifications work:

```bash
# Test action groups
bash test-notifications.sh

# Or via Portal:
# 1. Monitor → Action groups
# 2. Select action group
# 3. Click "Test"
# 4. Choose notification type (Email)
# 5. Send test
# 6. Check inbox
```

**Expected email:**
- ✅ Arrives within 1-2 minutes
- ✅ Subject: "Test notification from Azure"
- ✅ Clear sender (Azure/Microsoft)
- ✅ Not in spam

---

## 🔍 Verification

### Check Alert Status:

```bash
# Via CLI
az monitor metrics alert list \
  --resource-group mindx-hieunh01-rg \
  --output table

# Via Portal
# Monitor → Alerts → Alert rules
# Filter by: Resource group = mindx-hieunh01-rg
```

### Check Fired Alerts:

```
Portal:
  Monitor → Alerts → Alert history
  
Filter:
  - Time range: Last 24 hours
  - Severity: All
  - Alert state: Fired
```

### Verify with KQL:

```kql
// Check recent requests
requests
| where timestamp > ago(30m)
| summarize 
    Count = count(),
    Failed = countif(success == false),
    P95 = percentile(duration, 95),
    P99 = percentile(duration, 99)
| extend 
    ErrorRate = (Failed * 100.0) / Count,
    P95_Seconds = P95 / 1000,
    P99_Seconds = P99 / 1000
```

---

## 🐛 Troubleshooting

### Alert Didn't Fire:

```
1. ☐ Verify alert is enabled
2. ☐ Check if condition was actually met (run KQL queries)
3. ☐ Wait full evaluation period (2x frequency)
4. ☐ Check violations setting (might need more violations)
5. ☐ Verify action group is attached
```

### No Email Received:

```
1. ☐ Check spam/junk folder
2. ☐ Verify email address in action group
3. ☐ Test action group independently
4. ☐ Check email service allows Azure emails
5. ☐ Wait 15+ minutes (processing delay)
```

### Test Failed:

```
1. ☐ Check API URL is correct and reachable
2. ☐ Verify kubectl connected to correct cluster
3. ☐ Ensure sufficient permissions
4. ☐ Review script output for specific errors
5. ☐ Try manual testing method instead
```

---

## 📋 Testing Checklist

### Before Testing:

```
☐ All alerts created and enabled
☐ Action groups configured with emails
☐ Test action groups (verify emails work)
☐ Set API_URL environment variable
☐ Connect kubectl to AKS cluster
☐ Team notified of testing
☐ Low-traffic time period selected
```

### During Testing:

```
☐ Monitor Azure Portal in real-time
☐ Keep terminal open to view test output
☐ Check Application Insights for data
☐ Note start time for each test
☐ Watch for alerts to fire
```

### After Testing:

```
☐ All alerts fired as expected
☐ Email notifications received
☐ Alert descriptions are clear
☐ Auto-resolve works correctly
☐ No false positives observed
☐ Document any issues found
☐ Tune thresholds if needed
☐ Clean up test resources
```

---

## 📊 Test Results Template

Document your test results:

```
Date: YYYY-MM-DD
Tester: [Name]
Environment: [Production/Staging/Dev]

Performance Alerts:
  ☐ performance-p99-latency-above-10s
     Status: [Fired/Not Fired]
     Time to fire: [X minutes]
     Email received: [Yes/No]
     Notes: _________________
  
  ☐ performance-p95-latency-above-5s
     Status: [Fired/Not Fired]
     Time to fire: [X minutes]
     Email received: [Yes/No]
     Notes: _________________
  
  ☐ performance-avg-spike-300pct
     Status: [Fired/Not Fired]
     Time to fire: [X minutes]
     Email received: [Yes/No]
     Notes: _________________

Error Rate Alerts:
  ☐ error-rate-above-5pct
     Status: [Fired/Not Fired]
     Time to fire: [X minutes]
     Email received: [Yes/No]
     Notes: _________________
  
  [Continue for all alerts...]

Issues Found:
  - Issue 1: _______________
  - Issue 2: _______________

Actions Taken:
  - Action 1: _______________
  - Action 2: _______________

Overall Status: [Pass/Fail/Partial]
Next Steps: _______________
```

---

## 🎯 Success Criteria

Testing is successful when:

```
✅ All alerts fire within expected time (10-15 min)
✅ Email notifications arrive (< 15 min)
✅ Email content is clear and actionable
✅ Alerts auto-resolve when condition clears
✅ No false positives during normal operation
✅ Team understands how to respond
✅ Thresholds are appropriate for your workload
```

---

## 📚 Additional Resources

- **Detailed Testing:** See `TESTING_GUIDE.md`
- **Alert Setup:** See `ALERTS_SUMMARY.md`
- **Capacity Alerts:** See `CAPACITY_ALERTS_GUIDE.md`
- **Performance Alerts:** See `PERFORMANCE_ALERTS_GUIDE.md`
- **Azure Docs:** [Monitor Alerts Best Practices](https://docs.microsoft.com/azure/azure-monitor/alerts/alerts-best-practices)

---

## 🤝 Support

### Need Help?

1. Review `TESTING_GUIDE.md` for detailed procedures
2. Check troubleshooting section above
3. Verify prerequisites are met
4. Run tests manually to isolate issues
5. Check Azure Monitor documentation
6. Contact Azure Support if infrastructure issues

---

## ⏰ Recommended Testing Schedule

```
Immediate:
  ☐ Test after creating new alerts
  ☐ Test after modifying alert logic
  ☐ Test after infrastructure changes

Regular:
  ☐ Monthly: Random spot checks
  ☐ Quarterly: Full test suite
  ☐ After incidents: Verify alerts worked

Before Major Events:
  ☐ Before major deployments
  ☐ Before expected traffic spikes
  ☐ Before maintenance windows
```

---

## 🚀 Let's Test!

**Ready to start?**

```bash
# Quick start:
cd infrastructure/alerts
export API_URL="https://your-api.azurewebsites.net"
bash test-alerts.sh
```

**Or step-by-step:**

1. Test notifications: `bash test-notifications.sh`
2. Test performance: `bash test-performance.sh`
3. Test errors: `bash test-error-rate.sh`
4. Test capacity: `bash test-capacity.sh`

**Time needed:** ~1-2 hours for comprehensive testing

**Best time:** During low-traffic periods, with team notified

---

**Happy Testing! 🧪✅**

