# Debug Cookie Issues - Step by Step Guide

## 🚨 Problem
Cookies are not being set after OAuth login in production.

---

## 🔧 Quick Fixes Applied

### **1. Added Session Middleware**
Backend was missing `express-session` middleware needed for OAuth CSRF state.

**Fixed in:** `backend/src/index.ts`
```typescript
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
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  })
);
```

### **2. Added Debug Endpoints**
- `GET /debug/test-cookie` - Test if cookies can be set
- `GET /debug/check-cookies` - Check if cookies are received

---

## 🧪 Debugging Steps

### **Step 1: Deploy Updated Code**

```bash
# Build new image with session middleware
cd scripts
./build-and-push-image.sh backend

# Deploy to AKS
kubectl rollout restart deployment/backend-deployment -n mindx-app

# Wait for rollout
kubectl rollout status deployment/backend-deployment -n mindx-app
```

---

### **Step 2: Run Debug Script**

```bash
cd scripts
chmod +x debug-cookies.sh
./debug-cookies.sh
```

This script will check:
1. ✅ Environment variables
2. ✅ Backend logs
3. ✅ Cookie setting capability
4. ✅ CORS configuration
5. ✅ TLS/HTTPS setup

---

### **Step 3: Manual Testing**

#### **Test 1: Simple Cookie Test**

```bash
# Should return Set-Cookie header
curl -i https://hieunh01.mindx.edu.vn/api/debug/test-cookie

# Look for:
# Set-Cookie: testCookie=test-value-...; Path=/; HttpOnly; Secure; SameSite=Lax
```

**✅ Expected:** `Set-Cookie` header present  
**❌ If missing:** Check environment variables and HTTPS

---

#### **Test 2: OAuth Flow with Logs**

Open two terminals:

**Terminal 1 - Watch logs:**
```bash
kubectl logs -f -n mindx-app deployment/backend-deployment | grep -E "(OAuth|cookie|Cookie)"
```

**Terminal 2 - Trigger login:**
```bash
# Visit in browser
open https://hieunh01.mindx.edu.vn

# Or use curl to follow redirects
curl -L -v https://hieunh01.mindx.edu.vn/api/auth/mindx 2>&1 | grep -E "(Location|Set-Cookie)"
```

**Expected logs:**
```
[INFO] User authenticated successfully { userId: 'xxx' }
[INFO] Refresh token cookie set { secure: true, path: '/' }
[INFO] Redirecting user to frontend
```

**If you see these logs but NO cookie in browser:**
→ Issue is in **frontend** or **network layer**

**If you DON'T see these logs:**
→ Issue is in **OAuth flow** or **backend logic**

---

#### **Test 3: Check Environment Variables**

```bash
kubectl exec -n mindx-app deployment/backend-deployment -- env | grep -E "(NODE_ENV|FRONTEND_URL)"
```

**Expected:**
```
NODE_ENV=production
FRONTEND_URL=https://hieunh01.mindx.edu.vn
```

**❌ If wrong:**
```bash
# Check deployment config
kubectl get deployment backend-deployment -n mindx-app -o yaml | grep -A 10 "env:"
```

---

#### **Test 4: Test in Browser DevTools**

1. Open **DevTools** (`F12`)
2. Go to **Network** tab
3. Check **Preserve log** ✅
4. Visit: `https://hieunh01.mindx.edu.vn/api/debug/test-cookie`

**Check Response Headers:**
```
Set-Cookie: testCookie=...; Path=/; HttpOnly; Secure; SameSite=Lax
Access-Control-Allow-Origin: https://hieunh01.mindx.edu.vn
Access-Control-Allow-Credentials: true
```

**Check Application → Cookies:**
- Should see `testCookie` stored

**✅ If cookie is stored:**
→ Cookie mechanism works, issue is in OAuth flow

**❌ If cookie is NOT stored:**
→ Check CORS or HTTPS issues

---

## 🐛 Common Issues & Solutions

### **Issue 1: "secure cookie requires HTTPS"**

**Symptoms:**
```
[WARN] Secure cookie requires HTTPS
Cookie not set in browser
```

**Check:**
```bash
# Verify HTTPS is enabled
kubectl get ingress mindx-backend-ingress -n mindx-app -o yaml | grep -A 5 tls
```

**Should show:**
```yaml
tls:
  - hosts:
      - hieunh01.mindx.edu.vn
    secretName: mindx-app-tls-secret
```

**Fix:**
```bash
# If TLS secret doesn't exist, create it
kubectl create secret tls mindx-app-tls-secret \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n mindx-app
```

---

### **Issue 2: CORS blocking cookies**

**Symptoms:**
```
Access-Control-Allow-Credentials: false
Cookie not sent on requests
```

**Check backend CORS:**
```bash
kubectl exec -n mindx-app deployment/backend-deployment -- \
  grep -r "credentials" /app/dist/
```

**Should be:** `credentials: true`

**Check environment:**
```bash
kubectl exec -n mindx-app deployment/backend-deployment -- \
  env | grep FRONTEND_URL
```

**Must match your domain exactly:**
```
FRONTEND_URL=https://hieunh01.mindx.edu.vn
```

**NOT:**
- ❌ `http://hieunh01.mindx.edu.vn` (wrong protocol)
- ❌ `https://hieunh01.mindx.edu.vn/` (trailing slash)

---

### **Issue 3: Cookie set but not sent on subsequent requests**

**Symptoms:**
```
Cookie visible in DevTools → Application → Cookies
But not sent in Request Headers
```

**Check cookie attributes:**

| Attribute | Expected | Why |
|-----------|----------|-----|
| Path | `/` | Accessible for all /api/* endpoints |
| Domain | (not set) | Browser auto-sets to current domain |
| Secure | `true` | Requires HTTPS |
| HttpOnly | `true` | JavaScript cannot access |
| SameSite | `Lax` | Allows OAuth redirects |

**If Path is wrong:**
→ Cookie won't be sent to different paths

**If Domain is wrong:**
→ Cookie won't match current domain

---

### **Issue 4: OAuth logs show success but no cookie**

**Symptoms:**
```
[INFO] User authenticated successfully
[INFO] Refresh token cookie set
But browser has no cookie
```

**Possible causes:**

1. **Response is not reaching browser**
   ```bash
   # Check ingress logs
   kubectl logs -n ingress-nginx deployment/ingress-nginx-controller | grep "/api/auth/callback"
   ```

2. **Cookie is being overwritten**
   ```bash
   # Check if multiple Set-Cookie headers
   curl -i https://hieunh01.mindx.edu.vn/api/auth/callback?code=test 2>&1 | grep -i "set-cookie"
   ```

3. **Browser is blocking third-party cookies**
   - Test in **incognito mode**
   - Disable tracking protection temporarily

---

## 📋 Debugging Checklist

- [ ] Session middleware added to backend
- [ ] Backend deployed with new code
- [ ] `NODE_ENV=production` in backend pod
- [ ] `FRONTEND_URL` matches domain exactly
- [ ] HTTPS/TLS configured in ingress
- [ ] CORS `credentials: true` in backend
- [ ] Debug endpoint `/debug/test-cookie` sets cookie
- [ ] OAuth logs show "Refresh token cookie set"
- [ ] Network tab shows `Set-Cookie` header
- [ ] Browser DevTools shows cookie stored
- [ ] Subsequent requests send cookie

---

## 🎯 Quick Test Commands

```bash
# 1. Test cookie mechanism
curl -i https://hieunh01.mindx.edu.vn/api/debug/test-cookie

# 2. Check backend environment
kubectl exec -n mindx-app deployment/backend-deployment -- env | grep -E "(NODE_ENV|FRONTEND_URL)"

# 3. Watch OAuth logs live
kubectl logs -f -n mindx-app deployment/backend-deployment | grep cookie

# 4. Full debug
./scripts/debug-cookies.sh
```

---

## ✅ Success Criteria

When everything works, you should see:

1. **Test endpoint:**
   ```
   Set-Cookie: testCookie=...; Path=/; HttpOnly; Secure; SameSite=Lax
   ```

2. **OAuth callback:**
   ```
   [INFO] Refresh token cookie set { secure: true, path: '/' }
   ```

3. **Browser DevTools:**
   ```
   Application → Cookies → hieunh01.mindx.edu.vn
   ✅ refreshToken present
   ```

4. **API requests:**
   ```
   Request Headers:
   Cookie: refreshToken=eyJhbGc...
   ```

---

## 📞 Still Having Issues?

If cookies still don't work after all fixes:

1. **Check browser console for errors**
2. **Test with different browser** (Chrome, Firefox, Safari)
3. **Test in incognito/private mode**
4. **Verify domain DNS** resolves correctly
5. **Check firewall rules** (Azure NSG)

Share the output of:
```bash
./scripts/debug-cookies.sh > debug-output.txt
```

---

**Last Updated:** After adding session middleware and debug endpoints
