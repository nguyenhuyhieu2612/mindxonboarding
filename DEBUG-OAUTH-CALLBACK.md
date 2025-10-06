# Debug OAuth Callback - Missing Code Parameter

## 🚨 Error

```
[ERROR] OAuth callback missing code parameter
```

---

## 🔍 What This Means

Backend received a request to `/auth/callback` but the `code` parameter is missing from the query string.

---

## 📊 Possible Causes

### **1. User Cancelled Authentication** (Most likely)

**What happened:**
- User clicked login
- Redirected to OIDC provider
- User clicked "Cancel" or "Deny"
- OIDC provider redirected back without `code`

**Expected behavior:** Should receive `error` parameter instead

---

### **2. OIDC Provider Error**

**What happened:**
- Authentication failed at provider
- Provider sent error response

**Expected parameters:**
```
?error=access_denied
&error_description=User%20cancelled%20authentication
```

---

### **3. Incorrect Redirect**

**What happened:**
- Direct access to `/auth/callback` without going through OAuth flow
- Bookmark or manual URL entry

**Solution:** Ignore these requests

---

### **4. Probe/Bot Access** (Unlikely)

**What happened:**
- Health check or bot accessed callback URL

**Solution:** Filter by User-Agent

---

## 🔧 Debugging Added

Enhanced logging to see exact request details:

```typescript
logger.info("🔍 OAuth callback received", {
  url: req.url,              // Full URL with query string
  query: req.query,          // Parsed query parameters
  headers: {
    referer: ...,           // Where request came from
    origin: ...,            // Origin header
    userAgent: ...          // User agent string
  }
});
```

---

## 🧪 How to Debug

### **Step 1: Deploy Updated Code**

```bash
# Build with new logging
cd scripts
./build-and-push-image.sh backend

# Deploy
kubectl rollout restart deployment/backend -n mindx-app
kubectl rollout status deployment/backend -n mindx-app
```

---

### **Step 2: Watch Logs**

```bash
kubectl logs -f -n mindx-app -l app=backend | grep -E "(🔍|OAuth callback|ERROR)"
```

---

### **Step 3: Test Login Again**

1. Visit: `https://hieunh01.mindx.edu.vn`
2. Click "Sign in with MindX account"
3. **Complete authentication** (don't cancel)

---

### **Step 4: Check Logs**

**Successful login should show:**
```
[INFO] 🔍 OAuth callback received {
  url: '/auth/callback?code=abc123&state=xyz&iss=https://id.mindx.edu.vn',
  query: {
    code: 'abc123...',
    state: 'xyz',
    iss: 'https://id.mindx.edu.vn'
  },
  headers: {
    referer: 'https://id-dev.mindx.edu.vn/...',
    userAgent: 'Mozilla/5.0...'
  }
}
[INFO] Token exchange successful
[INFO] User authenticated successfully
```

**User cancelled should show:**
```
[INFO] 🔍 OAuth callback received {
  url: '/auth/callback?error=access_denied&error_description=User%20cancelled',
  query: {
    error: 'access_denied',
    error_description: 'User cancelled'
  }
}
[ERROR] OAuth provider returned error { error: 'access_denied', ... }
```

**Invalid/direct access should show:**
```
[INFO] 🔍 OAuth callback received {
  url: '/auth/callback',
  query: {},
  headers: {
    referer: undefined,
    userAgent: 'curl/...' or 'kube-probe/...'
  }
}
[ERROR] OAuth callback missing code parameter
```

---

## 🛡️ Filtering Invalid Requests

If you're getting spam/bot requests, add filtering:

```typescript
// Skip health check probes
if (req.headers['user-agent']?.includes('kube-probe')) {
  return res.status(400).send('Invalid request');
}

// Require referer from OIDC provider
if (!req.headers.referer?.includes('id.mindx.edu.vn')) {
  logger.warn("Callback without OIDC referer", {
    referer: req.headers.referer,
    query: req.query
  });
  return res.status(400).send('Invalid request');
}
```

---

## 📋 Common Scenarios

### **Scenario 1: User Testing - Cancelled Login**

**Logs:**
```
[INFO] 🔍 OAuth callback received
[ERROR] OAuth callback missing code parameter
```

**Action:** None needed - user will try again

---

### **Scenario 2: Direct Browser Access**

**User types:** `https://hieunh01.mindx.edu.vn/api/auth/callback`

**Logs:**
```
[INFO] 🔍 OAuth callback received { url: '/auth/callback', query: {} }
[ERROR] OAuth callback missing code parameter
```

**Action:** None needed - redirect to login page instead of error

---

### **Scenario 3: OIDC Provider Error**

**Logs:**
```
[INFO] 🔍 OAuth callback received
[ERROR] OAuth provider returned error { error: 'invalid_request' }
```

**Action:** Check OIDC provider configuration

---

### **Scenario 4: Successful Login**

**Logs:**
```
[INFO] 🔍 OAuth callback received { query: { code: '...', state: '...' } }
[INFO] Token exchange successful
[INFO] 🍪 Refresh token cookie SET
[INFO] User authenticated successfully
```

**Action:** Success! ✅

---

## 🎯 Next Steps

1. **Deploy updated code** with enhanced logging
2. **Test login** again
3. **Check logs** to see actual request details
4. **Determine** if it's:
   - User cancellation → Expected, ignore
   - Direct access → Add redirect to login
   - Bot/probe → Add filtering
   - Real issue → Further investigation

---

## 💡 Improved Error Handling (Optional)

Instead of just logging error, redirect user properly:

```typescript
if (!code || typeof code !== "string") {
  // Check if this is direct access vs cancelled auth
  if (Object.keys(req.query).length === 0) {
    // Direct access - redirect to login
    logger.warn("Direct callback access, redirecting to login");
    return res.redirect(APP_CONFIG.cors.frontendURL + "/login");
  }
  
  // Otherwise, missing code is an error
  logger.error("OAuth callback missing code parameter", {
    query: req.query,
    referer: req.headers.referer
  });
  
  const oauthError = {
    type: "OAUTH_ERROR",
    error: "Missing authorization code",
  };
  
  const encodedError = encodeURIComponent(JSON.stringify(oauthError));
  return res.redirect(
    `${APP_CONFIG.cors.frontendURL}/login#oauth_result=${encodedError}`
  );
}
```

---

## ✅ Expected Outcome

After deploying enhanced logging, you'll know exactly:
- ✅ What URL is being accessed
- ✅ What parameters are present
- ✅ Where the request came from
- ✅ Whether it's a real OAuth callback or direct access

Then you can decide:
- Ignore (if user cancellation)
- Add filtering (if bot/probe)
- Fix configuration (if real OAuth issue)

---

**Next:** Deploy updated code and check logs to identify exact issue.
