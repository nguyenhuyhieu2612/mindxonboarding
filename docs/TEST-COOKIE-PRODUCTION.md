# Testing Cookies in Production

## 🧪 **Quick Test Guide**

### **Step 1: Deploy Updated Code**

```bash
# Build and push new images
cd scripts
./build-and-push-image.sh

# Deploy to AKS
./deploy-all.sh

# Wait for rollout
kubectl rollout status deployment/backend-deployment -n mindx-app
kubectl rollout status deployment/frontend-deployment -n mindx-app
```

---

### **Step 2: Test Login Flow**

#### **2.1 Visit Your App**
```
https://hieunh01.mindx.edu.vn
```

#### **2.2 Open Browser DevTools**
- Press `F12`
- Go to **Network** tab
- Check **Preserve log** ✅
- Keep DevTools open

#### **2.3 Click "Login with MindX"**

Watch the network requests:

```
1. GET /api/auth/mindx
   Status: 302 (redirect to OIDC)

2. GET https://id.mindx.edu.vn/auth?...
   (OIDC login page)

3. POST to OIDC (after login)
   Status: 302 (redirect back)

4. GET /api/auth/callback?code=xxx&state=xxx
   Status: 302 (redirect to frontend)
   ✅ LOOK FOR: Set-Cookie header
   
   Response Headers:
   Set-Cookie: refreshToken=eyJhbGc...; 
               HttpOnly; 
               Secure; 
               SameSite=Lax; 
               Path=/; 
               Max-Age=604800

5. GET /login/#oauth_result=...
   Frontend processes OAuth result
```

#### **2.4 Check Cookie is Stored**

**DevTools → Application → Cookies → hieunh01.mindx.edu.vn**

Should see:

| Name | Value | Domain | Path | Expires | HttpOnly | Secure | SameSite |
|------|-------|--------|------|---------|----------|--------|----------|
| `refreshToken` | `eyJhbGc...` | `hieunh01.mindx.edu.vn` | `/` | (7 days) | ✅ | ✅ | `Lax` |

**✅ If cookie is present → SUCCESS!**

---

### **Step 3: Test Cookie is Sent on API Requests**

#### **3.1 Make an API Call**

Open browser console and run:

```javascript
// Test API call
fetch('https://hieunh01.mindx.edu.vn/api/health', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);
```

#### **3.2 Check Network Request**

**Network tab → Find the request → Headers**

**Request Headers:**
```
Cookie: refreshToken=eyJhbGc...  ✅
```

**✅ If cookie is sent → SUCCESS!**

---

### **Step 4: Test Refresh Token Endpoint**

#### **4.1 Wait for Access Token to Expire** (or manually trigger)

```javascript
// In browser console - force token refresh
fetch('https://hieunh01.mindx.edu.vn/api/auth/refresh-token', {
  method: 'POST',
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('New access token:', data);
  });
```

#### **4.2 Check Network Request**

**Request:**
```
POST /api/auth/refresh-token
Cookie: refreshToken=eyJhbGc...  ✅
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed.",
  "data": "eyJhbGc..."  // New access token
}
```

**✅ If you get new access token → SUCCESS!**

---

### **Step 5: Test Logout**

#### **5.1 Click Logout** (or use console)

```javascript
// In browser console
fetch('https://hieunh01.mindx.edu.vn/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
})
  .then(r => r.json())
  .then(console.log);
```

#### **5.2 Check Cookie is Cleared**

**DevTools → Application → Cookies**

`refreshToken` should be **GONE** ✅

---

## 🐛 **Debugging Failed Tests**

### **Problem 1: No Set-Cookie Header**

**Symptoms:**
```
GET /api/auth/callback?code=xxx
Response: 302
Headers: (no Set-Cookie)
```

**Check Backend Logs:**
```bash
kubectl logs -f deployment/backend-deployment -n mindx-app
```

Look for:
```
[INFO] User authenticated successfully { userId: 'xxx' }
[INFO] Refresh token cookie set { secure: true, path: '/' }
```

**If not present:**
- Backend crashed before setting cookie
- Check error logs for exceptions

---

### **Problem 2: Cookie Set But Not Stored**

**Symptoms:**
```
Response has Set-Cookie header
But DevTools shows no cookie
```

**Possible causes:**

#### **A. Domain Mismatch**
Cookie domain doesn't match current domain.

**Fix:** Remove `domain` attribute (let browser set it automatically)

#### **B. Secure Flag Without HTTPS**
Cookie has `Secure` but site is HTTP.

**Verify:**
```bash
kubectl get ingress mindx-backend-ingress -n mindx-app -o yaml | grep -A 10 tls
```

Should show:
```yaml
tls:
  - hosts:
      - hieunh01.mindx.edu.vn
    secretName: mindx-app-tls-secret
```

#### **C. Browser Blocking Third-Party Cookies**
Check browser settings:
- Chrome: Settings → Privacy → Cookies → Allow all cookies
- Safari: Preferences → Privacy → Uncheck "Prevent cross-site tracking"

---

### **Problem 3: Cookie Not Sent on Requests**

**Symptoms:**
```
Cookie exists in DevTools
But not sent in API requests
```

**Check:**

#### **A. Path Mismatch**
Cookie path: `/api/auth/`
Request path: `/api/user/profile`
→ Cookie won't be sent ❌

**Solution:** Ensure `path: "/"` when setting cookie

#### **B. Frontend Not Sending Credentials**

Check `frontend/src/services/api.ts`:
```typescript
withCredentials: true  // ✅ Must be true
```

#### **C. SameSite Blocking**

If making requests from different domain → blocked by SameSite.

**Verify:** Requests are from same domain (`hieunh01.mindx.edu.vn`)

---

### **Problem 4: CORS Error**

**Symptoms:**
```
Access to fetch at 'https://hieunh01.mindx.edu.vn/api/...'
has been blocked by CORS policy: 
The value of the 'Access-Control-Allow-Credentials' header 
in the response is '' which must be 'true'
```

**Check Backend CORS:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: APP_CONFIG.cors.origin,
  credentials: true  // ✅ Must be true
}));
```

**Check Environment Variable:**
```bash
kubectl get deployment backend-deployment -n mindx-app -o yaml | grep FRONTEND_URL
```

Should show:
```yaml
- name: FRONTEND_URL
  value: https://hieunh01.mindx.edu.vn
```

---

## 📋 **Complete Test Checklist**

- [ ] **Build & Deploy** updated backend
- [ ] **Visit** `https://hieunh01.mindx.edu.vn`
- [ ] **Login** with MindX OIDC
- [ ] **Verify** `Set-Cookie` header in Network tab
- [ ] **Check** cookie exists in DevTools
- [ ] **Verify** cookie has correct attributes:
  - [ ] `HttpOnly: true`
  - [ ] `Secure: true`
  - [ ] `SameSite: Lax`
  - [ ] `Path: /`
- [ ] **Test** cookie sent on API requests
- [ ] **Test** refresh token endpoint works
- [ ] **Test** logout clears cookie
- [ ] **Test** subsequent API calls fail after logout (401)

---

## ✅ **Expected Results**

### **Successful Login:**
```
✅ Cookie set with all correct attributes
✅ Cookie stored in browser
✅ Cookie sent on all /api/* requests
✅ Access token in Redux store
✅ User redirected to home page
```

### **Successful Refresh:**
```
✅ POST /api/auth/refresh-token returns new access token
✅ Refresh token cookie remains unchanged
✅ New access token stored in Redux
✅ Protected routes continue working
```

### **Successful Logout:**
```
✅ POST /api/auth/logout succeeds
✅ Cookie cleared from browser
✅ User redirected to login page
✅ Protected routes redirect to login
```

---

## 🎯 **Success Criteria**

All tests pass → **Cookie authentication working in production** ✅

If any test fails → Check debugging section above

---

**Tip:** Test in **private/incognito window** to avoid cached credentials.
