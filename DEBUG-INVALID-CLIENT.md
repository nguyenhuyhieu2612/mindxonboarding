# Debug: invalid_client Error

## ✅ **Progress So Far:**

```
✅ OAuth authorization works
✅ User can authenticate at OIDC provider
✅ Callback received with authorization code
❌ Token exchange fails with "invalid_client"
```

---

## 🔍 **What "invalid_client" Means:**

The OIDC provider's token endpoint rejected the request because:

1. **Client ID is wrong** ❌
2. **Client Secret is wrong** ❌
3. **Client not found** ❌
4. **Client credentials don't match** ❌
5. **redirect_uri mismatch** ⚠️ (Most likely!)

---

## 📊 **Current Configuration:**

```
Client ID: mindx-onboarding ✅
Client Secret: cHJldmVudGJvdW5kYmF0dHJlZWVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU= ✅
Redirect URI: https://hieunh01.mindx.edu.vn/api/auth/callback ✅
```

---

## 🚨 **Most Likely Issue: Redirect URI Mismatch in Token Exchange**

### **The Problem:**

OAuth 2.0 spec requires that the **EXACT SAME `redirect_uri`** used in:
1. Authorization request (Step 1)
2. Token exchange request (Step 2)

If they don't match → `invalid_client` error!

### **What Might Be Wrong:**

**Authorization Request (Step 1):**
```
redirect_uri=https://hieunh01.mindx.edu.vn/api/auth/callback
```

**Token Exchange (Step 2):**
```
redirect_uri=https://hieunh01.mindx.edu.vn/api/auth/callback
```

These should be IDENTICAL, but provider might be checking:
- URL encoding differences
- Trailing slash
- Case sensitivity
- Port numbers

---

## 🧪 **Debug Steps:**

### **Step 1: Deploy Enhanced Logging**

```bash
cd scripts
./build-and-push-image.sh backend
kubectl rollout restart deployment/backend -n mindx-app
```

### **Step 2: Test Login Again**

```bash
# Watch logs
kubectl logs -f -n mindx-app -l app=backend | Select-String "🔐|🔄|📤|❌"
```

Click login and check logs.

### **Step 3: Check Exact Parameters**

Logs will show:

```
[INFO] 🔐 Starting OAuth flow {
  extractedRedirectUri: 'https://hieunh01.mindx.edu.vn/api/auth/callback'
}

[INFO] 🔄 Preparing token exchange request {
  redirectUri: 'https://hieunh01.mindx.edu.vn/api/auth/callback',
  clientId: 'mindx-onboarding',
  clientSecretLength: 76
}

[INFO] 📤 Sending token exchange request {
  bodyParams: {
    grant_type: 'authorization_code',
    redirect_uri: 'https://hieunh01.mindx.edu.vn/api/auth/callback',
    client_id: 'mindx-onboarding'
  }
}
```

**Check:** Are both `redirect_uri` values EXACTLY the same?

---

## 🔍 **Possible Issues:**

### **1. URL Encoding Difference**

**Authorization:**
```
redirect_uri=https://hieunh01.mindx.edu.vn/api/auth/callback
```

**Token Exchange:**
```
redirect_uri=https%3A%2F%2Fhieunh01.mindx.edu.vn%2Fapi%2Fauth%2Fcallback
```

These are the same URL, but different encoding!

**Solution:** Ensure both use same encoding (both encoded or both not)

---

### **2. Provider Whitelist Issue**

Provider might have **multiple whitelisted URIs**, but client credentials only work with **one specific URI**.

**Example:**
```
Whitelisted:
✅ https://onboarding.mindx.edu.vn/auth/callback
✅ https://hieunh01.mindx.edu.vn/api/auth/callback

But client_secret only valid for:
✅ https://onboarding.mindx.edu.vn/auth/callback
❌ https://hieunh01.mindx.edu.vn/api/auth/callback
```

---

### **3. Client Secret Changed**

MindX admin might have **regenerated client secret** but not updated you.

**Solution:** Contact admin to verify current client secret

---

### **4. Wrong Token Endpoint**

Backend might be calling **wrong token endpoint**.

**Current:**
```
https://id-dev.mindx.edu.vn/token
```

**Might should be:**
```
https://id.mindx.edu.vn/token  (without -dev)
```

Or vice versa!

---

## 📧 **Email to MindX Admin:**

```
Subject: invalid_client Error - Need to Verify Configuration

Hi team,

OAuth callback đang nhận được authorization code thành công,
nhưng token exchange bị lỗi "invalid_client".

Backend configuration:
- Client ID: mindx-onboarding
- Client Secret: cHJldmVudGJvdW5kYmF0dHJlZWVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU=
- Redirect URI: https://hieunh01.mindx.edu.vn/api/auth/callback
- Token Endpoint: https://id-dev.mindx.edu.vn/token

Xin vui lòng xác nhận:
1. ✅ Client ID đúng không?
2. ✅ Client Secret có thay đổi gì không?
3. ✅ Redirect URI đã được add cho client này?
4. ✅ Token endpoint URL có đúng không?
5. ✅ Client có được enable/active không?

Error từ provider:
{
  "error": "invalid_client",
  "error_description": "client authentication failed"
}

Cảm ơn!
```

---

## 🎯 **Quick Checks:**

### **1. Test with cURL:**

```bash
# Simulate token exchange
curl -X POST https://id-dev.mindx.edu.vn/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=TEST_CODE" \
  -d "redirect_uri=https://hieunh01.mindx.edu.vn/api/auth/callback" \
  -d "client_id=mindx-onboarding" \
  -d "client_secret=cHJldmVudGJvdW5kYmF0dHJlZWVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU="
```

**Expected:** Should return error about invalid code, not invalid_client

**If invalid_client:** Client credentials or redirect_uri is wrong

---

### **2. Check Client Secret Encoding:**

The client secret looks like base64. Is it:
- Raw base64 string? ✅
- Needs to be decoded first? ❌
- Needs to be encoded again? ❌

---

### **3. Compare with Working Environment:**

If localhost works but production doesn't:

**Localhost:**
```
redirect_uri=http://localhost:3000/auth/callback
```

**Production:**
```
redirect_uri=https://hieunh01.mindx.edu.vn/api/auth/callback
```

**Check:** Provider might have different client configs for different redirect URIs!

---

## ✅ **Next Steps:**

1. ✅ Deploy enhanced logging
2. ✅ Test login and collect detailed logs
3. ✅ Verify both authorization and token exchange use EXACT same redirect_uri
4. ✅ Contact MindX admin to verify:
   - Client secret is correct
   - Redirect URI is properly configured
   - Client is active
   - Token endpoint URL is correct
5. ✅ Try cURL test to isolate issue

---

## 📋 **Expected Resolution:**

After fixing (likely admin updates config), logs will show:

```
[INFO] 🔐 Starting OAuth flow
[INFO] 🔍 OAuth callback received
[INFO] 🔄 Preparing token exchange request
[INFO] 📤 Sending token exchange request
[INFO] ✅ Token exchange successful
[INFO] 🍪 Refresh token cookie SET
[INFO] User authenticated successfully
```

---

**Priority:** 🟡 Medium - Have workaround (contact admin)

**Status:** Debugging - need admin verification
