# Alert Testing - Quick Reference Card

Fast reference for testing alerts. Print this or keep it handy!

## ⚡ Quick Commands

```bash
# Navigate to alerts directory
cd infrastructure/alerts

# Set API URL (REQUIRED!)
export API_URL="https://your-api.azurewebsites.net"

# Connect to AKS (for capacity tests)
az aks get-credentials --resource-group mindx-hieunh01-rg --name mindx-onboarding-aks

# Run tests
bash test-alerts.sh              # Interactive menu
bash test-notifications.sh       # Test emails
bash test-performance.sh         # Test latency alerts
bash test-error-rate.sh          # Test error alerts
bash test-capacity.sh            # Test AKS capacity
```

---

## 📊 Test Each Alert Type

### Performance (15 min):
```bash
NUM_REQUESTS=200 DELAY_MS=6000 bash test-performance.sh
```
**Triggers:** P95, P99, Spike alerts

### Error Rate (10 min):
```bash
ERROR_RATE=10 TOTAL_REQUESTS=100 bash test-error-rate.sh
```
**Triggers:** 5% error, 5xx error alerts

### Capacity (30 min):
```bash
CPU_CORES=2 MEMORY_MB=1500 bash test-capacity.sh
```
**Triggers:** CPU, Memory alerts

### System Down (15 min): ⚠️ **CAUTION!**
```bash
kubectl scale deployment backend --replicas=0    # Simulate down
# Wait 5-10 minutes
kubectl scale deployment backend --replicas=2    # Restore
```
**Triggers:** Zero requests, Availability alerts

---

## ✅ Verification

### Check Alert Status:
```bash
az monitor metrics alert list --resource-group mindx-hieunh01-rg --output table
```

### Check Fired Alerts:
```
Portal: Monitor → Alerts → Alert history
Filter: Last 24 hours, All severities
```

### Verify Data (KQL):
```kql
// In App Insights → Logs
requests
| where timestamp > ago(30m)
| summarize 
    Count = count(),
    Failed = countif(success == false),
    P95 = percentile(duration, 95),
    P99 = percentile(duration, 99)
| extend 
    ErrorRate = (Failed * 100.0) / Count,
    P95_Sec = P95/1000,
    P99_Sec = P99/1000
```

---

## ⏱️ Expected Timeline

```
T+0:     Start test
T+2m:    Complete test actions
T+5m:    Data in App Insights/Metrics
T+10m:   Alert evaluation runs
T+10-15m: Alert fires
T+15m:   Email received
T+20m+:  Auto-resolve
```

---

## 🐛 Quick Troubleshooting

**Alert didn't fire:**
1. Check alert is enabled
2. Verify threshold was exceeded (run KQL)
3. Wait 2x evaluation frequency
4. Check action group attached

**No email:**
1. Check spam folder
2. Test action group independently
3. Verify email address correct
4. Wait 15+ minutes

**Test failed:**
1. Check API_URL is set and reachable
2. Verify kubectl connected
3. Check permissions
4. Try manual method

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Alert not firing | Check `TESTING_GUIDE.md` → Troubleshooting |
| Email not received | Run `bash test-notifications.sh` |
| Script error | Check prerequisites & permissions |
| Need detailed steps | See `TESTING_GUIDE.md` |
| Create new alerts | See `CAPACITY_QUICKSTART.md` |

---

## 🎯 Success Criteria

✅ Alert fires within 15 minutes
✅ Email received
✅ Description clear
✅ Auto-resolves
✅ No false positives

---

## 📋 Quick Test Checklist

```
☐ export API_URL="https://..."
☐ az aks get-credentials (for capacity)
☐ bash test-notifications.sh
☐ bash test-performance.sh
☐ bash test-error-rate.sh
☐ bash test-capacity.sh
☐ Verify all emails received
☐ Check no false positives
☐ Document results
```

---

**Total test time: ~1-2 hours**

**Best time: Low-traffic periods, team notified**

---

## 🚀 Start Testing Now!

```bash
cd infrastructure/alerts
export API_URL="https://your-api.azurewebsites.net"
bash test-alerts.sh
```

---

**For detailed procedures, see `TESTING_README.md` or `TESTING_GUIDE.md`**

