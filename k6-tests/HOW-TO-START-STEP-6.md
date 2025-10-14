# Cách Bắt Đầu Step 6: Validate Production Metrics Setup

## 🎯 Mục tiêu

Xác nhận rằng Azure Application Insights của bạn đang hoạt động đúng và thu thập đầy đủ 4 Golden Signals.

---

## 📚 Tài liệu đã chuẩn bị

Tôi đã tạo các tài liệu sau để hỗ trợ bạn:

1. **`run-all-validations.ps1`** - Script chạy tất cả validation tests
2. **`STEP-6-VALIDATION-GUIDE.md`** - Hướng dẫn chi tiết từng bước
3. **`docs/MONITORING-SETUP.md`** - Template documentation (cần điền thông tin)
4. **`QUICK-REFERENCE.md`** - Quick reference card

---

## 🚀 Bắt Đầu Ngay (5 Bước Đơn Giản)

### Bước 1: Chuẩn bị (2 phút)

**Mở PowerShell** và kiểm tra:

```powershell
# 1. Kiểm tra k6 đã cài
k6 version
# ✅ Expected: k6.exe v1.3.0 (hoặc cao hơn)

# 2. Kiểm tra API đang chạy
curl https://hieunh01.mindx.edu.vn/health
# ✅ Expected: Status 200 OK

# 3. Kiểm tra kubectl kết nối được AKS
kubectl get pods -n mindx-test
# ✅ Expected: Thấy danh sách pods đang Running
```

---

### Bước 2: Chạy Validation Tests (30-35 phút)

```powershell
# Di chuyển vào thư mục k6-tests
cd k6-tests

# Chạy tất cả tests
.\run-all-validations.ps1
```

**Script sẽ tự động**:
- ✅ Kiểm tra API health trước khi test
- ✅ Chạy 4 tests (Latency, Traffic, Error Rate, Capacity)
- ✅ Đợi giữa các tests để data sync
- ✅ Hiển thị hướng dẫn verification
- ✅ Tạo log file

**Trong khi chờ**, bạn có thể:
- ☕ Uống cà phê
- 📖 Đọc `STEP-6-VALIDATION-GUIDE.md` để chuẩn bị cho bước verification
- 👀 Mở Azure Portal sẵn

---

### Bước 3: Verify trong Application Insights (15-20 phút)

**Đợi 2-5 phút** sau khi tests xong để data sync lên App Insights.

Sau đó:

1. **Mở Azure Portal**: https://portal.azure.com
2. **Tìm App Insights resource** của bạn
3. **Kiểm tra từng Golden Signal**:

#### ✅ Check Latency (Signal #1)
- Go to: **Performance**
- Time range: Last 1 hour
- Chạy KQL query:
  ```kql
  requests
  | where timestamp > ago(1h)
  | summarize P50=percentile(duration, 50), P95=percentile(duration, 95), P99=percentile(duration, 99)
  ```
- So sánh với k6 output (tolerance ±10%)

#### ✅ Check Traffic (Signal #2)
- Go to: **Metrics** → Select "Server requests"
- Time range: Last 1 hour
- Chạy KQL query:
  ```kql
  requests
  | where timestamp > ago(1h)
  | summarize TotalRequests=count(), AvgPerSecond=count()/3600.0
  ```
- So sánh total requests với k6 output

#### ✅ Check Error Rate (Signal #3)
- Go to: **Failures**
- Time range: Last 1 hour
- Xem error breakdown (4xx, 5xx)
- Chạy KQL query:
  ```kql
  requests
  | where timestamp > ago(1h)
  | summarize Total=count(), Failed=countif(success==false), ErrorRate=100.0*countif(success==false)/count()
  ```
- Verify error rate khớp với k6 output

#### ✅ Check Capacity (Signal #4)
- Go to: **Metrics** → Select "Process CPU" và "Available Memory"
- Xem biểu đồ có correlation với load không
- Chạy KQL query:
  ```kql
  performanceCounters
  | where timestamp > ago(1h) and name == "% Processor Time"
  | summarize AvgCPU=avg(value), MaxCPU=max(value) by bin(timestamp, 1m)
  | render timechart
  ```

**Chi tiết**: Xem `STEP-6-VALIDATION-GUIDE.md` phần Step 6.2

---

### Bước 4: Test Alerts (10-15 phút)

**Nếu bạn đã setup alerts** trong Step 5:

```powershell
# Chạy một test khác để trigger alert
k6 run --vus 200 --duration 5m validate-latency.js
```

**Kiểm tra**:
- [ ] Email notification đến (check inbox)
- [ ] Alert hiển thị trong Portal → Monitor → Alerts
- [ ] Alert details có đủ thông tin
- [ ] Alert tự động resolve sau khi condition cleared

**Nếu chưa setup alerts**: Đánh dấu để làm sau hoặc quay lại Step 5.

---

### Bước 5: Document Results (30-45 phút)

Mở file `docs/MONITORING-SETUP.md` và điền các thông tin:

**Cần điền**:
- [ ] App Insights resource name và details
- [ ] Baseline metrics từ validation tests
- [ ] Alert configurations (nếu có)
- [ ] Dashboard URLs
- [ ] Validation test results (fill vào tables)

**Tìm các [TODO]** trong file và thay thế bằng thông tin thật.

**Sau khi xong**:
```bash
git add docs/MONITORING-SETUP.md
git add k6-tests/
git commit -m "docs: Complete Week 2 Step 6 - Validate production metrics setup"
git push
```

---

## 📊 Bảng Theo Dõi Tiến Độ

| Bước | Task | Thời gian | Status |
|------|------|-----------|--------|
| 1 | Chuẩn bị môi trường | 2 min | ⏳ |
| 2 | Chạy validation tests | 30-35 min | ⏳ |
| 3 | Verify trong App Insights | 15-20 min | ⏳ |
| 4 | Test alerts | 10-15 min | ⏳ |
| 5 | Document setup | 30-45 min | ⏳ |
| **Tổng** | **~2 giờ** | | |

---

## ✅ Success Criteria

Step 6 hoàn thành khi:

- ✅ Tất cả 4 k6 tests chạy thành công
- ✅ Data visible trong App Insights
- ✅ 4 Golden Signals đều có data và match với k6 (±10%)
- ✅ Ít nhất 1 alert được test (hoặc documented lý do skip)
- ✅ File `MONITORING-SETUP.md` đã được điền đầy đủ
- ✅ Tất cả changes được commit và push

---

## 🆘 Gặp Vấn Đề?

### Tests fail ngay từ đầu?
→ Xem: `STEP-6-VALIDATION-GUIDE.md` → Troubleshooting section

### Không thấy data trong App Insights?
→ Đợi thêm 2-3 phút, hoặc check:
```bash
kubectl logs -n mindx-test deployment/backend-api --tail=100
```
Tìm dòng "Application Insights" initialization

### Alerts không fire?
→ Check Alert Rules trong Portal có Enabled không
→ Test Action Group manually

### Không chắc đã đúng chưa?
→ So sánh với Success Criteria ở trên
→ Đọc `QUICK-REFERENCE.md` để review checklist

---

## 📖 Tài liệu tham khảo

- **Chi tiết đầy đủ**: `STEP-6-VALIDATION-GUIDE.md`
- **Quick reference**: `QUICK-REFERENCE.md`
- **Test details**: `README.md`
- **Documentation template**: `docs/MONITORING-SETUP.md`

---

## 🎯 Next Steps Sau Khi Hoàn Thành

Sau khi hoàn thành Step 6:

1. ✅ Bạn có production monitoring hoàn chỉnh
2. ✅ 4 Golden Signals đều được validate
3. ✅ Documentation đầy đủ cho operations

**Tiếp theo**:
- 🎉 Hoàn thành **Part A: Production Metrics**
- 📊 Chuyển sang **Part B: Product Metrics with Google Analytics**
- 🚀 Hoặc **Part C: Problem Discovery**

---

**Chúc bạn thành công! 🚀**

Nếu có câu hỏi, check các tài liệu hoặc Azure Portal documentation.

