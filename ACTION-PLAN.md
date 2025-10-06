# 🚀 Action Plan - Fix OAuth Login

## ✅ **What's Been Fixed:**

### **1. Backend ConfigMap** ✅
```yaml
# BEFORE:
NODE_ENV: "development"  ❌
FRONTEND_URL: "/"        ❌

# AFTER:
NODE_ENV: "production"   ✅
FRONTEND_URL: "https://hieunh01.mindx.edu.vn"  ✅
```

---

## ⏳ **What Still Needs to be Done:**

### **1. Contact MindX Admin** 🔴 **ACTION REQUIRED**

**Email template:**

```
Subject: Add Redirect URI for OAuth Client - hieunh01.mindx.edu.vn

Hi MindX team,

Tôi đang deploy ứng dụng lên domain: https://hieunh01.mindx.edu.vn

Hiện đang gặp lỗi "invalid_client" khi OAuth login vì redirect URI chưa được whitelist.

Xin vui lòng thêm redirect URI này vào OIDC client "mindx-onboarding":

✅ https://hieunh01.mindx.edu.vn/api/auth/callback

Hiện tại client chỉ có:
- https://onboarding.mindx.edu.vn/auth/callback
- http://localhost:3000/auth/callback
- http://localhost:5173/auth/callback

Cảm ơn!
```

**⏰ ETA:** 2-5 minutes after admin receives email

---

### **2. Apply Updated ConfigMap** 🟡 **DO THIS NOW**

```bash
# Apply new ConfigMap
kubectl apply -f k8s/backend-configmap.yaml

# Restart backend to pick up changes
kubectl rollout restart deployment/backend-deployment -n mindx-app

# Wait for rollout
kubectl rollout status deployment/backend-deployment -n mindx-app
```

---

### **3. Verify Configuration** 🟡 **DO THIS NOW**

```bash
# Check environment variables
kubectl exec -n mindx-app deployment/backend-deployment -- env | grep -E "(NODE_ENV|FRONTEND_URL|OIDC_REDIRECT)"
```

**Expected output:**
```
NODE_ENV=production
FRONTEND_URL=https://hieunh01.mindx.edu.vn
OIDC_REDIRECT_URI=https://hieunh01.mindx.edu.vn/api/auth/callback
```

---

### **4. Test After Admin Adds Whitelist** 🟢 **WAIT FOR ADMIN**

**Watch logs:**
```bash
kubectl logs -f -n mindx-app deployment/backend-deployment | grep -E "(Token exchange|invalid_client|authenticated)"
```

**Test in browser:**
1. Visit: `https://hieunh01.mindx.edu.vn`
2. Click "Sign in with MindX account"
3. Complete authentication

**Expected logs (SUCCESS):**
```
[INFO] Token exchange successful {
  hasAccessToken: true,
  hasIdToken: true
}
[INFO] User authenticated successfully { userId: 'xxx' }
```

**If still seeing error:**
```
[ERROR] Error exchanging code for tokens {
  error: { error: 'invalid_client' }
}
```
→ Whitelist has not been added yet, wait for admin

---

## 📊 **Timeline:**

| Step | Status | Time | Who |
|------|--------|------|-----|
| 1. Fix ConfigMap | ✅ Done | 0 min | You |
| 2. Apply ConfigMap | 🟡 Now | 2 min | You |
| 3. Email MindX admin | 🔴 Now | 1 min | You |
| 4. Admin adds whitelist | ⏳ Wait | 2-5 min | MindX |
| 5. Test login | 🟢 After | 1 min | You |
| **TOTAL** | | **~10 min** | |

---

## 🔍 **What Was Wrong:**

### **Critical Issues:**

1. **`FRONTEND_URL: "/"`** ❌
   - Backend uses this for CORS and redirects
   - Must be full URL: `https://hieunh01.mindx.edu.vn`
   - **Impact:** CORS errors, cookie issues

2. **`NODE_ENV: "development"`** ❌
   - Cookies set with `secure: false` in development
   - Must be `"production"` for secure cookies
   - **Impact:** Cookies not set in HTTPS

3. **Redirect URI not whitelisted** ❌
   - Provider rejects token exchange
   - Needs admin to add to whitelist
   - **Impact:** Login completely fails

---

## ✅ **After All Fixes:**

| Component | Status |
|-----------|--------|
| ConfigMap | ✅ Fixed |
| NODE_ENV | ✅ production |
| FRONTEND_URL | ✅ Full URL |
| CORS | ✅ Will work |
| Cookies | ✅ Will be set |
| OAuth flow | 🟡 Waiting for whitelist |

---

## 🎯 **Next Commands (Copy & Paste):**

```bash
# Step 1: Apply ConfigMap
kubectl apply -f k8s/backend-configmap.yaml

# Step 2: Restart backend
kubectl rollout restart deployment/backend-deployment -n mindx-app

# Step 3: Watch logs
kubectl logs -f -n mindx-app deployment/backend-deployment | grep -E "(Token|cookie|authenticated)"
```

---

## 📧 **Email Admin NOW:**

Đây là blocking issue - ứng dụng KHÔNG THỂ login được cho đến khi admin add whitelist!

**Priority:** 🔴 **HIGH** - Production is down

---

**Summary:**
- ✅ Code fixes: Done
- 🟡 Deploy fixes: Do now (2 min)
- 🔴 Contact admin: Do now (1 min)  
- ⏳ Wait for admin: 2-5 min
- ✅ Total downtime: ~10 minutes

**Read full explanation:** `OAUTH-FIX-EXPLANATION.md`
