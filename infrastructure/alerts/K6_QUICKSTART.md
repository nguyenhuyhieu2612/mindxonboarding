# k6 Alert Testing - Quick Start

Fast track to testing alerts with k6 (recommended method).

## ⚡ 3-Minute Setup

### 1. Install k6:

**Windows:**
```powershell
choco install k6
# Or: winget install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
# See: https://k6.io/docs/get-started/installation/
```

### 2. Verify:
```bash
k6 version
```

### 3. Run Tests:

**Windows (PowerShell):**
```powershell
cd infrastructure/alerts/k6-tests
.\run-tests.ps1
```

**Linux/macOS:**
```bash
cd infrastructure/alerts/k6-tests
chmod +x run-tests.sh
./run-tests.sh
```

**Or directly:**
```bash
# Set API URL
export API_URL="https://your-api.azurewebsites.net"

# Run test
k6 run performance-test.js
```

---

## 🎯 Available Tests

| Test | File | Duration | What it tests |
|------|------|----------|---------------|
| **Performance** | `performance-test.js` | 15 min | P95, P99 latency |
| **Error Rate** | `error-rate-test.js` | 15 min | Error rate, 5xx errors |
| **Spike** | `spike-test.js` | 22 min | Response time spike 300% |

---

## 🚀 Quick Commands

```bash
# Performance test
k6 run performance-test.js

# Error rate test (custom error rate)
k6 run -e ERROR_RATE=15 error-rate-test.js

# Spike test
k6 run spike-test.js

# With custom API URL
k6 run -e API_URL=https://your-api.com performance-test.js
```

---

## ✅ What to Expect

### During Test:
```
✓ status is 200
✓ response time OK

http_req_duration..............: avg=5.2s  p(95)=8s  p(99)=12s
http_req_failed................: 1.50%
http_reqs......................: 1253   1.4/s
vus............................: 50     min=10  max=50
```

### After Test (10-15 min):
```
✅ Alerts fire in Azure Portal
✅ Email notifications received
✅ Data visible in App Insights
```

---

## 🆚 k6 vs Bash Scripts

| Feature | k6 | Bash |
|---------|----|----|
| Realism | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Metrics | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Easy setup | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Professional | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation:** k6 for production, bash for quick checks

---

## 📚 More Info

- **Detailed guide:** `README.md` (in k6-tests directory)
- **k6 docs:** https://k6.io/docs/
- **Alternative tests:** `../test-*.sh` (bash scripts)

---

## 🎉 That's It!

**Time to first test:** < 5 minutes

**Professional load testing:** ✅

**Production-ready:** ✅

---

**Questions?** See `README.md` in this directory

**Need bash alternative?** See `../TESTING_README.md`

