# Step 3: Frontend React App Instrumentation - COMPLETED ✅

**From:** `docs/plans/week-2/tasks.md` - Step 3: Frontend React App Instrumentation (Optional but Recommended)

---

## 📋 Overview

Implemented comprehensive Application Insights instrumentation for React frontend including:
- ✅ Page view tracking (automatic with React Router)
- ✅ Browser exceptions tracking
- ✅ AJAX calls performance monitoring
- ✅ User session tracking
- ✅ Custom events tracking
- ✅ User authentication context management

---

## ✅ Completed Steps

### Step 3.1: Install Application Insights JavaScript SDK

**Already installed** in `frontend/package.json`:
```json
{
  "@microsoft/applicationinsights-react-js": "^18.3.6",
  "@microsoft/applicationinsights-web": "^3.3.6"
}
```

### Step 3.2: Configure Browser Telemetry ✅

**File:** `frontend/src/app-insights.ts`

Configured comprehensive browser telemetry:

```typescript
{
  // Page Views
  enableAutoRouteTracking: true,     // Automatic page view on route change
  autoTrackPageVisitTime: true,      // Track time spent on each page
  
  // Browser Exceptions
  disableExceptionTracking: false,   // Track JavaScript errors
  enableUnhandledPromiseRejectionTracking: true,
  
  // AJAX Calls
  enableAjaxPerfTracking: true,      // Track fetch/XHR performance
  enableAjaxErrorStatusText: true,
  disableAjaxTracking: false,
  disableFetchTracking: false,
  
  // User Sessions
  enableSessionStorageBuffer: true,
  enableCorsCorrelation: true,       // Correlate with backend
  
  // Performance
  samplingPercentage: 100,
  maxBatchInterval: 5000,            // Send every 5 seconds
}
```

### Step 3.3: Add Custom Browser Events ✅

Implemented custom tracking functions:

**Helper Functions:**
- `trackEvent()` - Custom events
- `trackPageView()` - Page views
- `trackException()` - Errors/exceptions
- `trackMetric()` - Numerical metrics
- `trackUserAction()` - User interactions
- `setAuthenticatedUser()` - Set user context
- `clearAuthenticatedUser()` - Clear user context

**Tracking Implementation:**

#### Authentication Events
**Files:** `frontend/src/hooks/use-login.ts`, `frontend/src/hooks/use-logout.ts`

```typescript
// Login tracking
trackEvent("auth_login_attempted", { provider, method: "oauth-popup" });
trackEvent("auth_login_success", { provider, userId, userEmail });
trackEvent("auth_login_failed", { provider, reason, error });
setAuthenticatedUser(userId, email);

// Logout tracking
trackEvent("auth_logout_attempted");
trackEvent("auth_logout_success");
clearAuthenticatedUser();
```

#### Page View Events
**Files:** `frontend/src/screens/login.tsx`, `frontend/src/screens/home.tsx`

```typescript
// Automatic tracking via React Router (enabled)
// Manual tracking for analytics
trackPageView("Login");
trackEvent("page_view", { pageName: "Login", pageType: "authentication" });
```

#### User Interaction Events
**File:** `frontend/src/screens/home.tsx`

```typescript
trackUserAction("button_click", {
  buttonName: "Click Me",
  clickCount: "5",
  userId: user.id,
});
```

#### Error Tracking
**File:** `frontend/src/components/error-boundary.tsx`

```typescript
// Automatic error boundary tracking
appInsights.trackException({
  exception: error,
  properties: {
    componentStack,
    location,
    errorBoundary: "true",
  },
});
```

### Step 3.4: Update React App Deployment ✅

**Environment Variable Configuration:**

**File:** `frontend/src/vite-env.d.ts`
```typescript
interface ImportMetaEnv {
  readonly VITE_APPLICATIONINSIGHTS_CONNECTION_STRING?: string;
}
```

**Kubernetes Deployment:**
**File:** `k8s/frontend-deployment.yaml`
```yaml
envFrom:
  - configMapRef:
      name: frontend-config
  - secretRef:
      name: monitoring-secrets  # Contains APPLICATIONINSIGHTS_CONNECTION_STRING
```

**Docker Build:**
**File:** `frontend/Dockerfile`
```dockerfile
ARG VITE_APPLICATIONINSIGHTS_CONNECTION_STRING
ENV VITE_APPLICATIONINSIGHTS_CONNECTION_STRING=$VITE_APPLICATIONINSIGHTS_CONNECTION_STRING
```

---

## 📊 Telemetry Events Tracked

### Automatic (SDK Built-in)
- ✅ Page views (React Router navigation)
- ✅ Page visit duration
- ✅ AJAX/Fetch requests
- ✅ Request performance (timing)
- ✅ Request failures
- ✅ Unhandled exceptions
- ✅ Unhandled promise rejections
- ✅ User sessions

### Custom Events
| Event Name | Properties | Location |
|------------|-----------|----------|
| `page_view` | pageName, pageType, userId, userName | All screens |
| `auth_login_attempted` | provider, method | use-login.ts |
| `auth_login_success` | provider, userId, userEmail | use-login.ts |
| `auth_login_failed` | provider, reason, error | use-login.ts |
| `auth_logout_attempted` | timestamp | use-logout.ts |
| `auth_logout_success` | timestamp | use-logout.ts |
| `auth_logout_failed` | error, timestamp | use-logout.ts |
| `user_action` | action, buttonName, clickCount, userId | home.tsx |

---

## 🔍 Azure Portal Queries

### View all custom events
```kusto
customEvents
| where timestamp > ago(24h)
| project timestamp, name, customDimensions
| order by timestamp desc
```

### Authentication analytics
```kusto
customEvents
| where name startswith "auth_login"
| summarize 
    Total = count(),
    Success = countif(name == "auth_login_success"),
    Failed = countif(name == "auth_login_failed")
    by provider = tostring(customDimensions.provider)
| extend SuccessRate = (Success * 100.0) / Total
```

### Page views by page
```kusto
pageViews
| where timestamp > ago(7d)
| summarize ViewCount = count() by name
| order by ViewCount desc
```

### User actions
```kusto
customEvents
| where name == "user_action"
| extend action = tostring(customDimensions.action)
| summarize count() by action
| order by count_ desc
```

### Browser exceptions
```kusto
exceptions
| where timestamp > ago(24h)
| extend errorBoundary = tostring(customDimensions.errorBoundary)
| project timestamp, type, outerMessage, errorBoundary
| order by timestamp desc
```

---

## 🧪 Testing

### 1. Local Development

```bash
cd frontend
npm install
npm run dev
```

**Set environment variable:**
```bash
# .env.local
VITE_APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=..."
```

**Check console:**
- Should see: `✅ Application Insights initialized for frontend`

### 2. Test Tracking

**Page Views:**
1. Navigate to http://localhost:5173/login
2. Login to app
3. Check console/network for telemetry events

**User Actions:**
1. Click "Click Me!" button
2. Check that `user_action` event is sent

**Exceptions:**
1. Click "Throw A Error" button
2. Error Boundary should catch and track to Application Insights

### 3. Verify in Azure Portal

1. Go to Azure Portal → Application Insights
2. Navigate to "Logs"
3. Run queries above to see data

---

## 📁 Files Modified

### Created
```
docs/STEP_3_FRONTEND_INSTRUMENTATION.md
frontend/src/vite-env.d.ts
```

### Modified
```
frontend/src/app-insights.ts             (Complete rewrite with full config)
frontend/src/hooks/use-login.ts          (Added tracking)
frontend/src/hooks/use-logout.ts         (Added tracking)
frontend/src/screens/login.tsx           (Added page view tracking)
frontend/src/screens/home.tsx            (Added page view + interaction tracking)
frontend/src/components/error-boundary.tsx (Enhanced error tracking)
frontend/Dockerfile                      (Added build args)
k8s/frontend-deployment.yaml             (Added monitoring secrets)
```

---

## 📊 Expected Data Flow

```
User Action (Browser)
    ↓
Application Insights SDK
    ↓
Batching (every 5s or 10 events)
    ↓
Azure Application Insights
    ↓
Available in Portal (~1-2 minutes)
```

---

## ✅ Success Criteria

- [x] Application Insights JavaScript SDK installed
- [x] React Plugin configured for automatic route tracking
- [x] Browser telemetry configured (AJAX, exceptions, sessions)
- [x] Page views tracked automatically
- [x] Custom events for authentication flow
- [x] Custom events for user interactions
- [x] Error Boundary integrated with tracking
- [x] User context management (authenticated users)
- [x] Environment variables configured
- [x] Kubernetes deployment updated
- [x] Docker build configuration updated
- [x] No linter errors
- [x] Documentation completed

---

## 🎯 Key Features

### 1. Automatic Tracking
- ✅ Page views on React Router navigation
- ✅ AJAX/Fetch requests
- ✅ JavaScript errors
- ✅ Unhandled promise rejections
- ✅ User sessions

### 2. Custom Events
- ✅ Authentication flow (login/logout)
- ✅ User interactions (button clicks)
- ✅ Page-specific analytics
- ✅ Error boundary tracking

### 3. User Context
- ✅ Authenticated user ID attached to all events
- ✅ User email for correlation
- ✅ Automatic context on login
- ✅ Clear context on logout

### 4. Performance
- ✅ Batching (5 second intervals)
- ✅ Sampling (100% in current config)
- ✅ Session storage buffering
- ✅ CORS correlation with backend

---

## 🔄 Next Steps

**From tasks.md - Remaining Week 2 Steps:**

### Step 4: Configure Monitoring Dashboards
- Create Application Dashboard with Golden Signals
- Set up Application Map
- Create custom Kusto queries
- Build Live Metrics Stream

### Step 5: Implement Critical Alerting
- Define alert rules (system down, performance, errors, capacity)
- Configure action groups (email, SMS)
- Test alert configuration
- Create runbook documentation

### Part B: Product Metrics with Google Analytics
- Create GA4 property
- React app integration
- Custom event tracking
- Reports and dashboards

### Part C: Problem Discovery and Rapid Prototyping
- Identify 3+ problems
- Create solution proposals
- Build proof-of-concept prototype
- Collect stakeholder feedback

---

## 📚 References

- [Application Insights JavaScript SDK](https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript)
- [Application Insights React Plugin](https://github.com/microsoft/applicationinsights-react-js)
- [Week 2 Tasks](../plans/week-2/tasks.md)

---

## 🎉 Summary

**Step 3: Frontend React App Instrumentation is COMPLETE!**

The React frontend now has comprehensive Application Insights instrumentation:
- Full visibility into user behavior
- Authentication flow tracking
- Page view and interaction analytics
- Error and exception monitoring
- Performance metrics
- Correlation with backend telemetry

All telemetry data flows to the same Application Insights instance as the backend, enabling **end-to-end observability** across the full stack.

