# Step 6 Quick Reference Card

## 🎯 Quick Commands

### Run All Validation Tests
```powershell
cd k6-tests
.\run-all-validations.ps1
```

### Run Individual Tests
```powershell
k6 run validate-latency.js      # ~9 min - Latency metrics
k6 run validate-traffic.js      # ~6 min - Traffic volume
k6 run validate-error-rate.js   # ~3 min - Error tracking
k6 run validate-capacity.js     # ~10 min - CPU/Memory
```

### Check Kubernetes
```bash
kubectl get pods -n mindx-test                # Pod status
kubectl top pods -n mindx-test                # Resource usage
kubectl logs -n mindx-test deployment/backend-api --tail=50  # Logs
kubectl describe pod -n mindx-test -l app=backend-api  # Pod details
```

---

## 📊 Essential KQL Queries

### Latency Check
```kql
requests
| where timestamp > ago(1h)
| summarize P50=percentile(duration, 50), P95=percentile(duration, 95), P99=percentile(duration, 99)
```

### Traffic Check
```kql
requests
| where timestamp > ago(1h)
| summarize TotalRequests=count(), AvgPerSecond=count()/3600.0
```

### Error Rate Check
```kql
requests
| where timestamp > ago(1h)
| summarize Total=count(), Failed=countif(success==false), ErrorRate=100.0*countif(success==false)/count()
```

### Capacity Check
```kql
performanceCounters
| where timestamp > ago(1h) and name == "% Processor Time"
| summarize AvgCPU=avg(value), MaxCPU=max(value)
```

---

## ✅ Validation Checklist

### Step 6.1: Generate Test Load
- [ ] Run all 4 k6 tests
- [ ] Tests complete without errors
- [ ] Wait 2-5 min for data sync

### Step 6.2: Verify Golden Signals
- [ ] Latency: P50/P95/P99 match (±10%)
- [ ] Traffic: Request count matches (±10%)
- [ ] Error Rate: Error % matches (±10%)
- [ ] Capacity: CPU/Memory correlate with load

### Step 6.3: Test Alerts
- [ ] Trigger at least 1 alert
- [ ] Receive notification
- [ ] Alert auto-resolves

### Step 6.4: Documentation
- [ ] Fill `docs/MONITORING-SETUP.md`
- [ ] Add validation results
- [ ] Commit to repository

---

## 🔗 Quick Links

### Azure Portal
- **Portal**: https://portal.azure.com
- **Your App Insights**: [TODO: Add direct link]
- **Alerts**: Portal → Monitor → Alerts
- **Dashboards**: Portal → App Insights → [Resource Name]

### Dashboards to Check
1. **Performance** - Latency metrics
2. **Metrics** - Traffic volume, CPU, Memory
3. **Failures** - Error rates and details
4. **Live Metrics** - Real-time monitoring

---

## ⏱️ Expected Timeline

| Task | Duration |
|------|----------|
| Run all k6 tests | 30-35 min |
| Wait for data sync | 5 min |
| Verify in App Insights | 15-20 min |
| Test alerts | 10-15 min |
| Document setup | 30-45 min |
| **Total** | **~2 hours** |

---

## 🆘 Quick Troubleshooting

### No data in App Insights?
```bash
# Check pod logs for App Insights initialization
kubectl logs -n mindx-test deployment/backend-api --tail=100 | grep -i "insights"
```

### Tests failing?
```bash
# Check API health
curl https://hieunh01.mindx.edu.vn/health

# Check pod status
kubectl get pods -n mindx-test
```

### High latency?
```bash
# Check resource usage
kubectl top pods -n mindx-test
kubectl top nodes
```

### Alerts not firing?
- Go to Portal → Monitor → Alerts → Alert rules
- Verify rule is **Enabled**
- Test Action Group manually

---

## 📋 Validation Tolerance

| Metric | Acceptable Difference |
|--------|----------------------|
| Latency | ±10% |
| Traffic Count | ±10% |
| Error Rate | ±5% |
| CPU/Memory | Correlation visible |

---

## 🎯 Success Criteria

Step 6 PASSED when:
- ✅ All 4 tests completed
- ✅ Data visible in App Insights
- ✅ Metrics match within tolerance
- ✅ At least 1 alert tested
- ✅ Documentation complete

---

## 📞 Need Help?

1. Check `STEP-6-VALIDATION-GUIDE.md` for detailed guide
2. Check `README.md` for k6 test details
3. Check `docs/MONITORING-SETUP.md` for runbooks
4. Review Application Insights logs in Azure Portal

---

**Good luck! 🚀**

