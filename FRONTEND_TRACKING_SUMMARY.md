# Frontend Application Insights - Quick Summary

## ✅ Step 3 Complete

Frontend React App Instrumentation theo `docs/plans/week-2/tasks.md` đã hoàn thành.

---

## 📊 What's Tracked

### Automatic (SDK)
- Page views (React Router)
- AJAX/Fetch requests
- JavaScript errors
- Promise rejections
- User sessions
- Request performance

### Custom Events
- `auth_login_attempted`, `auth_login_success`, `auth_login_failed`
- `auth_logout_attempted`, `auth_logout_success`, `auth_logout_failed`
- `page_view` (all screens)
- `user_action` (button clicks)
- Error boundary exceptions

---

## 🔧 How to Use

### Import and Track Events
```typescript
import { trackEvent, trackUserAction, trackException } from "@/app-insights";

// Track custom event
trackEvent("feature_used", {
  featureName: "export",
  userId: user.id,
});

// Track user action
trackUserAction("button_click", {
  buttonName: "Submit",
});

// Track exception
try {
  riskyOperation();
} catch (error) {
  trackException(error, { action: "operation" });
}
```

### Set User Context (on login)
```typescript
import { setAuthenticatedUser } from "@/app-insights";

setAuthenticatedUser(user.id.toString(), user.email);
```

### Clear User Context (on logout)
```typescript
import { clearAuthenticatedUser } from "@/app-insights";

clearAuthenticatedUser();
```

---

## 🎯 Key Files

- `frontend/src/app-insights.ts` - Configuration & helper functions
- `frontend/src/hooks/use-login.ts` - Login tracking
- `frontend/src/hooks/use-logout.ts` - Logout tracking
- `frontend/src/screens/*.tsx` - Page view tracking
- `frontend/src/components/error-boundary.tsx` - Error tracking

---

## 📚 Documentation

**Full documentation:** `docs/STEP_3_FRONTEND_INSTRUMENTATION.md`

Includes:
- Complete implementation details
- Azure Portal queries
- Testing instructions
- All tracked events reference

---

## 🚀 Deploy

```bash
# Build with Application Insights
docker build \
  --build-arg VITE_APPLICATIONINSIGHTS_CONNECTION_STRING="..." \
  -t mindxonboardingacr.azurecr.io/frontend:latest \
  ./frontend

# Push
docker push mindxonboardingacr.azurecr.io/frontend:latest

# Deploy
kubectl rollout restart deployment/frontend -n mindx-app
```

---

## 🔍 Verify

### Console
Look for: `✅ Application Insights initialized for frontend`

### Network Tab
Filter by "dc.services" - should see telemetry requests

### Azure Portal
```kusto
customEvents
| where timestamp > ago(1h)
| order by timestamp desc
```

---

**Status:** ✅ Production Ready

