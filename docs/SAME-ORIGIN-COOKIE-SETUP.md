# Same-Origin Cookie Setup - Production Guide

## 🎯 **Your Architecture**

```
Domain:   hieunh01.mindx.edu.vn
Frontend: https://hieunh01.mindx.edu.vn        (/)
Backend:  https://hieunh01.mindx.edu.vn/api    (/api)
OIDC:     https://id.mindx.edu.vn              (external provider)
```

✅ **Same-Origin Setup** → Frontend and backend share the same domain, protocol, and port.

---

## 🔍 **Why Cookies Were Not Working**

### **Issue: Missing `path` Attribute**

When you set a cookie **without explicit `path`**, the browser defaults to:
```
Cookie path = URL path of the Set-Cookie response
```

**Example:**
```
Response from: https://hieunh01.mindx.edu.vn/api/auth/callback
Cookie set WITHOUT path → path = /api/auth/
```

**Problem:** Cookie only sent for URLs starting with `/api/auth/`, not `/api/refresh-token` or other endpoints!

---

## ✅ **Solution: Always Set `path: "/"`**

### **1. Login Callback (`/api/auth/callback`)**

```typescript
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: APP_CONFIG.app.environment === "production",
  sameSite: "lax",  // ✅ Perfect for same-origin
  path: "/",        // ✅ CRITICAL: Make cookie accessible everywhere
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### **2. Logout (`/api/auth/logout`)**

```typescript
res.clearCookie("refreshToken", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",  // ✅ Must match the path used when setting
});
```

### **3. Refresh Token Error (`/api/auth/refresh-token`)**

```typescript
// Clear invalid token
res.clearCookie("refreshToken", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
});
```

**⚠️ Bug Fixed:** Changed `res.clearCookie("rt")` → `res.clearCookie("refreshToken")`

---

## 🔄 **OAuth Flow with Same-Origin**

```
1. User clicks "Login" at: https://hieunh01.mindx.edu.vn
   ↓
2. Frontend redirects to backend:
   GET https://hieunh01.mindx.edu.vn/api/auth/mindx
   ↓
3. Backend redirects to OIDC:
   302 → https://id.mindx.edu.vn/auth?client_id=...
   ↓
4. User authenticates at OIDC provider
   ↓
5. OIDC redirects back:
   302 → https://hieunh01.mindx.edu.vn/api/auth/callback?code=xxx
   ↓
6. Backend sets cookie and redirects to frontend:
   Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Lax; Path=/
   302 → https://hieunh01.mindx.edu.vn/login/#oauth_result=...
   ↓
7. Frontend receives auth data from URL hash
   ↓
8. Subsequent API calls automatically send refreshToken cookie:
   GET https://hieunh01.mindx.edu.vn/api/user/profile
   Cookie: refreshToken=xxx
```

---

## 🔐 **Security Best Practices**

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `httpOnly: true` | ✅ | JavaScript cannot access (prevents XSS) |
| `secure: true` | ✅ | Only sent over HTTPS (prevents MITM) |
| `sameSite: "lax"` | ✅ | Protects against CSRF, works with OAuth redirects |
| `path: "/"` | ✅ | Cookie accessible for all API endpoints |

### **Why `sameSite: "lax"` Works Here:**

```
OIDC redirect flow:
id.mindx.edu.vn → hieunh01.mindx.edu.vn (top-level navigation)
                  ↓
           GET /api/auth/callback
                  ↓
          [Cookie is set here] ✅
                  ↓
     Redirect to frontend (same domain)
                  ↓
    Cookie sent on subsequent requests ✅
```

**`lax`** allows cookies on:
- ✅ Top-level GET requests (OAuth callbacks)
- ✅ Same-site requests (all API calls from your frontend)

**`lax`** blocks cookies on:
- ❌ Cross-site POST/PUT/DELETE (CSRF protection)
- ❌ `<iframe>` or `<img>` from other domains (tracking protection)

---

## 🧪 **Testing Checklist**

### **1. Login Flow**

```bash
# Visit your app
open https://hieunh01.mindx.edu.vn

# Click "Login with MindX"
# After OAuth → Check browser DevTools
```

**Expected:**
```
Application → Cookies → hieunh01.mindx.edu.vn
✅ refreshToken present
✅ HttpOnly: true
✅ Secure: true
✅ SameSite: Lax
✅ Path: /
```

### **2. API Calls Send Cookie**

```bash
# In browser console
fetch('https://hieunh01.mindx.edu.vn/api/user/profile', {
  credentials: 'include'
})
```

**Network Tab:**
```
Request URL: https://hieunh01.mindx.edu.vn/api/user/profile
Request Headers:
  Cookie: refreshToken=eyJhbGc...  ✅
```

### **3. Refresh Token Works**

```bash
# When access token expires
POST https://hieunh01.mindx.edu.vn/api/auth/refresh-token

# Should automatically send refreshToken cookie
# Backend responds with new access token
```

### **4. Logout Clears Cookie**

```bash
POST https://hieunh01.mindx.edu.vn/api/auth/logout

# Check DevTools → Cookies
# refreshToken should be gone ✅
```

---

## 🐛 **Troubleshooting**

### **Issue 1: Cookie not sent on API requests**

**Symptoms:**
```
401 Unauthorized on /api/auth/refresh-token
Browser DevTools shows cookie exists but not sent
```

**Cause:** Cookie `path` mismatch

**Solution:** Ensure `path: "/"` when setting cookie

---

### **Issue 2: Cookie cleared but still appears**

**Symptoms:**
```
Logout called, but cookie still in DevTools
```

**Cause:** `clearCookie` options don't match `cookie` options

**Solution:** Use **exact same** options:
```typescript
// Set
res.cookie("refreshToken", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
});

// Clear (must match exactly)
res.clearCookie("refreshToken", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
});
```

---

### **Issue 3: Cookie works in dev, fails in production**

**Symptoms:**
```
Cookies work on localhost
Cookies don't work on hieunh01.mindx.edu.vn
```

**Cause:** HTTPS not enabled or `secure: true` in development

**Solution:**
```typescript
secure: APP_CONFIG.app.environment === "production",
// Only require HTTPS in production
```

**Verify HTTPS:**
```bash
# Check ingress has TLS
kubectl get ingress mindx-ingress -n mindx-app -o yaml | grep tls
```

---

### **Issue 4: CORS errors**

**Symptoms:**
```
Access to fetch at 'https://hieunh01.mindx.edu.vn/api/...' 
has been blocked by CORS policy: credentials mode
```

**Cause:** CORS not configured to allow credentials

**Solution:**
```typescript
// Backend: src/index.ts
app.use(cors({
  origin: APP_CONFIG.cors.origin,
  credentials: true,  // ✅ Must be true
}));

// Frontend: src/services/api.ts
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // ✅ Must be true
});
```

---

## 📋 **Deployment Checklist**

### **Backend Environment Variables**

```env
NODE_ENV=production
FRONTEND_URL=https://hieunh01.mindx.edu.vn

# OIDC Configuration
OIDC_ISSUER=https://id.mindx.edu.vn
OIDC_AUTHORIZATION_ENDPOINT=https://id-dev.mindx.edu.vn/auth
OIDC_TOKEN_ENDPOINT=https://id-dev.mindx.edu.vn/token
OIDC_USERINFO_ENDPOINT=https://id-dev.mindx.edu.vn/me
OIDC_REDIRECT_URI=https://hieunh01.mindx.edu.vn/api/auth/callback
OIDC_CLIENT_ID=mindx-onboarding
OIDC_CLIENT_SECRET=<secret>
OIDC_SCOPE=openid profile email
```

### **Ingress Configuration**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mindx-ingress
  namespace: mindx-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    # ✅ Important for cookies with OAuth
    nginx.ingress.kubernetes.io/proxy-cookie-path: /api /
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - hieunh01.mindx.edu.vn
      secretName: tls-secret  # ✅ HTTPS required for secure cookies
  rules:
    - host: hieunh01.mindx.edu.vn
      http:
        paths:
          # Backend API
          - path: /api/(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend-service
                port:
                  number: 8000
          # Frontend SPA
          - path: /(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: frontend-service
                port:
                  number: 3000
```

**Key annotation:**
```yaml
nginx.ingress.kubernetes.io/proxy-cookie-path: /api /
```
This rewrites cookie path from `/api` to `/` if needed.

---

## ✅ **Summary**

| Configuration | Development | Production |
|--------------|-------------|------------|
| **Domain** | `localhost:3000` (frontend)<br>`localhost:3000/api` (backend) | `hieunh01.mindx.edu.vn` (same for both) |
| **`httpOnly`** | `true` | `true` |
| **`secure`** | `false` | `true` ✅ |
| **`sameSite`** | `"lax"` | `"lax"` ✅ |
| **`path`** | `"/"` | `"/"` ✅ |
| **HTTPS** | Optional | **Required** ✅ |
| **CORS credentials** | `true` | `true` ✅ |

---

## 🎯 **Key Takeaways**

1. ✅ **Always set `path: "/"`** for cookies in same-origin setup
2. ✅ **`sameSite: "lax"`** is perfect for OAuth flows (no need for `"none"`)
3. ✅ **Frontend must use `withCredentials: true`** for all API calls
4. ✅ **Backend must enable `credentials: true`** in CORS
5. ✅ **HTTPS is mandatory** in production for `secure: true`
6. ✅ **`clearCookie` options must exactly match `cookie` options**

---

**Status:** ✅ **FIXED** - Cookies now work reliably in production with same-origin setup!

**Ref:** [Express Cookie Documentation](https://expressjs.com/en/api.html#res.cookie)
