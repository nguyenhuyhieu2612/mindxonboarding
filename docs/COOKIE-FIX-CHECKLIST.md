# Cookie Fix - Quick Action Checklist ✅

## 🎯 What Was Fixed

1. ✅ Added `express-session` middleware (was missing!)
2. ✅ Added `path: "/"` to all cookie operations
3. ✅ Added debug endpoints to test cookies
4. ✅ Created debug script

---

## 🚀 Deploy Now

```bash
# Step 1: Build new backend image
cd scripts
./build-and-push-image.sh backend

# Step 2: Deploy to AKS
kubectl rollout restart deployment/backend-deployment -n mindx-app

# Step 3: Wait for deployment
kubectl rollout status deployment/backend-deployment -n mindx-app
```

---

## 🧪 Test After Deploy

### **Quick Test (5 seconds):**
```bash
curl -i https://hieunh01.mindx.edu.vn/api/debug/test-cookie | grep -i "set-cookie"
```

**✅ Expected:** See `Set-Cookie: testCookie=...`

---

### **Full Debug (30 seconds):**
```bash
chmod +x scripts/debug-cookies.sh
./scripts/debug-cookies.sh
```

This will check:
- Environment variables ✅
- Cookie mechanism ✅
- CORS settings ✅
- HTTPS/TLS ✅

---

### **Real OAuth Test (in browser):**

1. Open browser: `https://hieunh01.mindx.edu.vn`
2. Open DevTools (`F12`) → **Network** tab
3. Check **Preserve log** ✅
4. Click **"Login with MindX"**
5. After login, check:

**Network tab:**
```
Request: GET /api/auth/callback?code=...
Response Headers:
  Set-Cookie: refreshToken=...; Path=/; HttpOnly; Secure; SameSite=Lax ✅
```

**Application tab:**
```
Cookies → hieunh01.mindx.edu.vn
  refreshToken: eyJhbGc... ✅
```

---

## 🐛 If Still Not Working

### **Check 1: Environment Variables**
```bash
kubectl exec -n mindx-app deployment/backend-deployment -- env | grep -E "(NODE_ENV|FRONTEND_URL)"
```

**Must be:**
```
NODE_ENV=production
FRONTEND_URL=https://hieunh01.mindx.edu.vn
```

### **Check 2: Backend Logs**
```bash
kubectl logs -n mindx-app deployment/backend-deployment --tail=50 | grep -E "(cookie|Cookie)"
```

**Should see:**
```
[INFO] Refresh token cookie set { secure: true, path: '/' }
```

### **Check 3: HTTPS**
```bash
kubectl get ingress mindx-backend-ingress -n mindx-app -o yaml | grep -A 3 tls
```

**Must have:**
```yaml
tls:
  - hosts:
      - hieunh01.mindx.edu.vn
    secretName: mindx-app-tls-secret
```

---

## 📝 Key Changes Made

### **backend/src/index.ts**
```typescript
// ADDED: Session middleware
import session from "express-session";

app.use(
  session({
    secret: APP_CONFIG.session.accessTokenSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: APP_CONFIG.app.environment === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    },
  })
);

// ADDED: Debug endpoints
app.get("/debug/test-cookie", ...);
app.get("/debug/check-cookies", ...);
```

### **backend/src/routes/auth.routes.ts**
```typescript
// Set cookie with explicit path
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: APP_CONFIG.app.environment === "production",
  sameSite: "lax",
  path: "/", // ← CRITICAL
  maxAge: APP_CONFIG.session.refreshTokenExpiresIn * 1000,
});
```

---

## ✅ Success Indicators

| What to Check | Expected Result |
|--------------|-----------------|
| Test endpoint | `Set-Cookie` header present |
| Backend logs | "Refresh token cookie set" |
| Browser Network | `Set-Cookie` in response headers |
| Browser Cookies | `refreshToken` stored |
| API requests | `Cookie: refreshToken=...` sent |

---

## 🎉 When All Tests Pass

Cookies work! Remove debug endpoints:

```typescript
// backend/src/index.ts
// DELETE these after confirming cookies work:
// app.get("/debug/test-cookie", ...);
// app.get("/debug/check-cookies", ...);
```

---

**Time to completion:** 5-10 minutes (build + deploy + test)

**Read full details:** `docs/DEBUG-COOKIE-ISSUES.md`
