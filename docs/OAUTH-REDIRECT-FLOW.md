# OAuth Redirect Flow - Modern Implementation

## Tổng quan

Đã thay thế **popup-based OAuth flow** bằng **redirect-based OAuth flow** - một cách tiếp cận hiện đại và chuẩn hơn cho Single Page Applications (SPA).

## Tại sao thay đổi?

### Vấn đề với Popup Flow:
- ❌ `window.opener` bị `null` sau khi OAuth provider redirect về callback
- ❌ Popup bị chặn bởi popup blockers
- ❌ UX kém trên mobile devices
- ❌ Phức tạp để debug và maintain
- ❌ Các vấn đề về cross-origin và security

### Ưu điểm của Redirect Flow:
- ✅ Không có vấn đề với `window.opener`
- ✅ Không bị popup blocker
- ✅ Tốt hơn cho mobile UX
- ✅ Dễ debug và maintain
- ✅ Tuân thủ OAuth 2.0 best practices
- ✅ Đơn giản và reliable hơn

## Workflow mới

### 1. User khởi tạo login

```typescript
// Frontend: user clicks "Sign in with MindX"
const handleLogin = () => {
  // Lưu state vào sessionStorage
  sessionStorage.setItem("oauth_state", randomState);
  sessionStorage.setItem("oauth_return_url", currentUrl);
  
  // Redirect toàn bộ page
  window.location.href = `${API_BASE_URL}/auth/mindx`;
}
```

### 2. Backend redirect tới OAuth Provider

```typescript
// Backend: /auth/mindx endpoint
router.get("/mindx", async (req, res) => {
  const state = generateRandomState();
  const authURL = buildOAuthURL(state);
  
  // Lưu state vào session
  req.session.authState = state;
  
  // Redirect tới MindX OAuth
  res.redirect(authURL);
});
```

### 3. OAuth Provider xác thực user

User đăng nhập trên MindX OAuth page và authorize app.

### 4. OAuth Provider redirect về callback

```
https://your-backend.com/auth/callback?code=ABC123&state=xyz
```

### 5. Backend xử lý callback

```typescript
// Backend: /auth/callback endpoint
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  
  // Verify state (CSRF protection)
  if (state !== req.session.authState) {
    return redirectWithError("Invalid state");
  }
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  const userInfo = await getUserInfo(tokens.access_token);
  
  // Generate our own JWT tokens
  const { accessToken, refreshToken } = generateTokens(userInfo);
  
  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, { httpOnly: true });
  
  // Redirect về frontend với result trong URL hash
  const result = { type: "OAUTH_SUCCESS", payload: { accessToken, user: userInfo } };
  res.redirect(`${FRONTEND_URL}#oauth_result=${encodeURIComponent(JSON.stringify(result))}`);
});
```

### 6. Frontend xử lý callback

```typescript
// Frontend: useEffect hook
React.useEffect(() => {
  const hash = window.location.hash;
  
  if (hash.includes("oauth_result")) {
    const params = new URLSearchParams(hash.substring(1));
    const result = JSON.parse(decodeURIComponent(params.get("oauth_result")));
    
    if (result.type === "OAUTH_SUCCESS") {
      // Lưu access token
      localStorage.setItem("accessToken", result.payload.accessToken);
      
      // Update state
      setData(result.payload);
      
      // Redirect về trang trước đó hoặc home
      navigate(sessionStorage.getItem("oauth_return_url") || "/");
    }
    
    // Cleanup URL hash
    window.history.replaceState(null, "", window.location.pathname);
  }
}, []);
```

## Security Features

### 1. State Parameter (CSRF Protection)
- Random state được tạo và lưu vào session
- Verify state khi callback để chống CSRF attacks

### 2. HttpOnly Cookies cho Refresh Token
- Refresh token được lưu trong httpOnly cookie
- Không thể access từ JavaScript → chống XSS

### 3. Short-lived Access Token
- Access token có thời gian sống ngắn (15 phút)
- Lưu trong localStorage để dễ access
- Refresh bằng refresh token khi hết hạn

### 4. URL Hash thay vì Query Parameters
- Dùng URL hash (#) để truyền sensitive data
- Hash không được gửi lên server trong HTTP requests

## Error Handling

### Backend tự động redirect về frontend với error:

```typescript
const oauthError = {
  type: "OAUTH_ERROR",
  error: "Detailed error message"
};

res.redirect(`${FRONTEND_URL}#oauth_result=${encodeURIComponent(JSON.stringify(oauthError))}`);
```

### Frontend hiển thị error cho user:

```typescript
if (result.type === "OAUTH_ERROR") {
  setError(result.error);
  // Show error message to user
}
```

## Testing

### 1. Test thành công flow:
```bash
# 1. Start backend và frontend
cd backend && npm run dev
cd frontend && npm run dev

# 2. Mở browser: http://localhost:3000/login
# 3. Click "Sign in with MindX account"
# 4. Login trên MindX OAuth page
# 5. Verify redirect về home page với access token
```

### 2. Test error flow:
- Deny permission trên OAuth page
- Invalid credentials
- Network errors

### 3. Check console logs:
```
[Frontend] Initiating OAuth redirect flow with state: abc123
[Backend] User authenticated successfully
[Backend] Redirecting user to frontend
[Frontend] Detected OAuth callback in URL
[Frontend] OAuth authentication successful
[Frontend] Login successful, redirecting to home...
```

## Files Changed

### Frontend:
- `frontend/src/hooks/use-mindx-login.ts` - Redirect flow thay vì popup
- `frontend/src/screens/login.tsx` - Hiển thị loading & error states

### Backend:
- `backend/src/routes/auth.routes.ts` - Redirect callback thay vì postMessage HTML

## Migration Notes

### Breaking Changes:
- ❌ Không còn sử dụng popup window
- ❌ Không còn postMessage giữa popup và parent window

### Backward Compatibility:
- ✅ Token format không đổi
- ✅ API endpoints không đổi (/auth/mindx, /auth/callback)
- ✅ Cookie và session handling không đổi

## Best Practices

1. **Luôn verify state parameter** - Chống CSRF
2. **Dùng httpOnly cookies cho refresh tokens** - Bảo mật hơn
3. **Short-lived access tokens** - Giảm thiểu rủi ro nếu bị lộ
4. **Cleanup URL hash sau khi parse** - Tránh lộ thông tin
5. **Log đầy đủ cho debugging** - Dễ troubleshoot

## Troubleshooting

### Vấn đề: Không redirect về frontend sau login
- ✅ Check `FRONTEND_URL` trong backend .env
- ✅ Check CORS settings
- ✅ Check browser console logs

### Vấn đề: State mismatch error
- ✅ Check session configuration trong backend
- ✅ Ensure cookies are enabled
- ✅ Check sameSite cookie settings

### Vấn đề: Tokens không được lưu
- ✅ Check localStorage permissions
- ✅ Check browser privacy settings
- ✅ Check cookie settings (httpOnly, secure, sameSite)

## Future Enhancements

- [ ] Implement PKCE (Proof Key for Code Exchange) cho extra security
- [ ] Add token refresh mechanism
- [ ] Add logout functionality
- [ ] Add remember me feature
- [ ] Implement OAuth for Google login

