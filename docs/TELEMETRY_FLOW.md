# Application Insights Telemetry Flow

## 🔄 Frontend to Backend Correlation

```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  React App (mindx-frontend)                                │
│  ├─ Application Insights SDK                               │
│  ├─ React Plugin (route tracking)                          │
│  └─ Custom tracking helpers                                │
│                                                             │
│  What's tracked automatically:                             │
│  ✓ Page views (React Router)                              │
│  ✓ Page visit time                                        │
│  ✓ AJAX/Fetch requests                                    │
│  ✓ Request performance                                    │
│  ✓ JavaScript errors                                      │
│  ✓ Unhandled promises                                     │
│  ✓ User sessions                                          │
│                                                             │
│  Custom events:                                            │
│  ✓ auth_login_attempted                                   │
│  ✓ auth_login_success                                     │
│  ✓ auth_logout_success                                    │
│  ✓ page_view (detailed)                                   │
│  ✓ user_action (clicks)                                   │
│                                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ Batched every 5 seconds
               │ Correlation ID: ai.operation.id
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              Azure Application Insights                     │
│                   (Shared Instance)                         │
│                                                             │
│  Stores all telemetry:                                     │
│  • Dependencies (frontend → backend API calls)             │
│  • Requests (backend API endpoints)                        │
│  • Events (custom events)                                  │
│  • Exceptions (errors)                                     │
│  • Traces (logs)                                           │
│  • Metrics (performance)                                   │
│  • Page Views (frontend)                                   │
│                                                             │
│  Correlation:                                              │
│  • Frontend AJAX → Backend Request (same operation ID)     │
│  • End-to-end transaction tracing                         │
│  • User context across stack                              │
│                                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ API calls with correlation headers
               │ Request-Id, Request-Context
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Node.js Express (mindx-backend)                           │
│  ├─ Application Insights SDK                               │
│  ├─ Automatic request tracking                             │
│  └─ Custom telemetry                                       │
│                                                             │
│  What's tracked automatically:                             │
│  ✓ HTTP requests                                           │
│  ✓ Request duration                                        │
│  ✓ Response codes                                          │
│  ✓ Dependencies (Redis, external APIs)                     │
│  ✓ Exceptions                                              │
│  ✓ Performance counters (CPU, memory)                      │
│                                                             │
│  Custom events:                                            │
│  ✓ user-login (backend validation)                        │
│  ✓ user-logout                                             │
│  ✓ Business metrics                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Example: User Login

```
1. User clicks "Login with Google" (Browser)
   ↓
   trackEvent("auth_login_attempted", { provider: "google" })
   ↓
   Frontend batches telemetry
   ↓
   [Frontend Event sent to App Insights]

2. Popup opens, OAuth flow starts
   ↓
   Frontend tracks AJAX call to /auth/google (automatic)
   ↓
   Request sent with correlation ID
   ↓

3. Backend receives request
   ↓
   [Backend Request tracked automatically]
   ↓
   Backend processes auth, calls Redis (dependency tracked)
   ↓
   trackEvent("user-login", { id, email })
   ↓
   [Backend Event sent to App Insights]
   ↓
   Response sent

4. Frontend receives success
   ↓
   trackEvent("auth_login_success", { userId, email })
   ↓
   setAuthenticatedUser(userId, email)
   ↓
   [Frontend Event sent to App Insights]
   ↓
   Navigate to /home

5. Azure Application Insights
   ↓
   Correlates all events by operation ID
   ↓
   Shows end-to-end transaction:
   - Frontend: auth_login_attempted
   - Frontend: dependency to /auth/google
   - Backend: request /auth/google
   - Backend: dependency to Redis
   - Backend: custom event user-login
   - Frontend: auth_login_success
```

---

## 🔗 Correlation Features

### Enabled in Frontend:
```typescript
enableCorsCorrelation: true
```

### What this does:
- Attaches `Request-Id` header to all AJAX/Fetch calls
- Attaches `Request-Context` header
- Allows backend to correlate frontend → backend calls
- Enables **Application Map** in Azure Portal

### Result:
- See full request flow from browser → API → database
- Identify bottlenecks in distributed system
- Track errors across services

---

## 📈 Azure Portal Views

### Application Map
```
[Frontend] ──AJAX──> [Backend API] ──Redis──> [Redis]
                            │
                            └──HTTP──> [External APIs]
```

### End-to-End Transaction
```
Operation: User Login (2.3s total)
├─ [Frontend] auth_login_attempted (0ms)
├─ [Frontend] dependency: POST /auth/google (2.1s)
│   └─ [Backend] request: POST /auth/google (2.0s)
│       ├─ [Backend] dependency: Redis GET (5ms)
│       ├─ [Backend] dependency: Redis SET (3ms)
│       └─ [Backend] event: user-login
└─ [Frontend] auth_login_success (0ms)
```

---

## 🎯 Key Metrics Available

### Frontend Metrics:
- Page views per route
- AJAX call performance
- JavaScript errors
- User actions
- Session duration
- Authentication success rate

### Backend Metrics:
- API endpoint latency
- Request rate (traffic)
- Error rate
- Dependency duration
- Resource usage (CPU, memory)

### Combined Metrics:
- End-to-end request time
- Frontend vs backend latency
- User journey across stack
- Error correlation

---

## 🔍 Example Queries

### See correlated frontend + backend events
```kusto
union requests, dependencies, customEvents, pageViews
| where timestamp > ago(1h)
| where operation_Id == "specific-operation-id"
| project timestamp, itemType, name, duration, cloud_RoleName
| order by timestamp asc
```

### Login flow end-to-end
```kusto
customEvents
| where name == "auth_login_attempted"
| join kind=inner (
    customEvents
    | where name == "auth_login_success"
) on operation_Id
| project 
    AttemptTime = timestamp,
    SuccessTime = timestamp1,
    Duration = datetime_diff('millisecond', timestamp1, timestamp),
    Provider = tostring(customDimensions.provider)
```

### Frontend performance
```kusto
dependencies
| where cloud_RoleName == "mindx-frontend"
| where timestamp > ago(24h)
| summarize 
    AvgDuration = avg(duration),
    P95Duration = percentile(duration, 95)
    by name
| order by AvgDuration desc
```

---

## 🚀 Benefits

1. **End-to-end visibility** - See entire user journey
2. **Distributed tracing** - Track requests across services
3. **Performance insights** - Identify slow operations
4. **Error correlation** - Link frontend errors to backend issues
5. **User context** - Understand behavior by user
6. **Business metrics** - Track feature usage and conversions

---

## 📚 Reference

- Frontend: `frontend/src/app-insights.ts`
- Backend: `backend/src/config/app-insights.ts`
- Azure Portal: Application Insights → Application Map / Logs

