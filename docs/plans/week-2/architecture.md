# Week 2 Final Architecture: Metrics and Monitoring Layer

**Authors:** HuyNQ, Claude

This document illustrates the enhanced architecture after implementing comprehensive monitoring with Azure Application Insights and Google Analytics on top of the Week 1 infrastructure.

## Architecture Overview

Week 2 adds observability and analytics layers to the existing full-stack application from Week 1:
- **Production Monitoring:** Azure Application Insights tracking the Four Golden Signals
- **Product Analytics:** Google Analytics 4 for user behavior and business metrics  
- **Alerting System:** Critical alerts via email and Azure mobile app
- **Problem Discovery:** Separate prototype branch for innovation experiments

## ASCII Architecture Diagram - Complete Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           MONITORING & ANALYTICS LAYER                              │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                        AZURE APPLICATION INSIGHTS                            │   │
│  │                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │   │
│  │  │   GOLDEN        │  │    LOGGING      │  │   ALERTING      │              │   │
│  │  │   SIGNALS       │  │                 │  │                 │              │   │
│  │  │                 │  │ • Default Logs  │  │ • Email         │              │   │
│  │  │ • Latency (P50, │  │ • Custom Events │  │ • Mobile App    │              │   │
│  │  │   P95, P99)     │  │ • Structured    │  │ • Webhooks      │              │   │
│  │  │ • Error Rate    │  │   Logging       │  │                 │              │   │
│  │  │ • Traffic       │  │ • Correlation   │  │ Thresholds:     │              │   │
│  │  │ • Capacity      │  │   IDs           │  │ • Availability  │              │   │
│  │  │   (CPU/RAM/     │  │ • Debug Traces  │  │   <99%          │              │   │
│  │  │   Disk)         │  │                 │  │ • P95 >5s       │              │   │
│  │  └─────────────────┘  └─────────────────┘  │ • Errors >5%    │              │   │
│  │           ▲                    ▲            │ • CPU >80%      │              │   │
│  │           │                    │            └─────────────────┘              │   │
│  │           └────────────────────┴──────────────────┐                          │   │
│  │                                                    │                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                     TELEMETRY COLLECTION                               │ │   │
│  │  │  • API Instrumentation (Node.js SDK)                                   │ │   │
│  │  │  • Browser Instrumentation (JavaScript SDK)                            │ │   │
│  │  │  • Distributed Tracing                                                 │ │   │
│  │  │  • Performance Counters                                                │ │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                         GOOGLE ANALYTICS 4                                  │   │
│  │                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │   │
│  │  │  USER BEHAVIOR  │  │  CUSTOM EVENTS  │  │    REPORTING    │              │   │
│  │  │                 │  │                 │  │                 │              │   │
│  │  │ • Page Views    │  │ • User Actions  │  │ • Dashboards    │              │   │
│  │  │ • Sessions      │  │ • Feature Usage │  │ • User Flow     │              │   │
│  │  │ • User Journey  │  │ • Conversions   │  │ • Retention     │              │   │
│  │  │ • Demographics  │  │ • Errors        │  │ • Acquisition   │              │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘              │   │
│  │                             ▲                                                 │   │
│  │                             │                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │              GA4 SDK INTEGRATION (React Frontend Only)                  │ │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                           Telemetry & Events Flow
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        WEEK 1 INFRASTRUCTURE (UNCHANGED)                            │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                     AZURE KUBERNETES SERVICE (AKS)                          │   │
│  │                                                                               │   │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        INGRESS CONTROLLER                             │   │   │
│  │  │                    https://yourdomain.com                             │   │   │
│  │  │                                                                        │   │   │
│  │  │  ┌──────────────────────┐      ┌──────────────────────┐              │   │   │
│  │  │  │  /  → React App      │      │  /api/* → API        │              │   │   │
│  │  │  └──────────────────────┘      └──────────────────────┘              │   │   │
│  │  └────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                               │   │
│  │  ┌────────────────────────────┐    ┌────────────────────────────┐            │   │
│  │  │     REACT APP POD          │    │      API POD               │            │   │
│  │  │                            │    │                            │            │   │
│  │  │  ┌──────────────────────┐  │    │  ┌──────────────────────┐  │            │   │
│  │  │  │   React App          │  │    │  │   Node.js API       │  │            │   │
│  │  │  │   + GA4 SDK          │  │◄──►│  │   + App Insights    │  │            │   │
│  │  │  │   + App Insights JS  │  │    │  │     SDK             │  │            │   │
│  │  │  └──────────────────────┘  │    │  └──────────────────────┘  │            │   │
│  │  └────────────────────────────┘    └────────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                      AZURE CONTAINER REGISTRY                               │   │
│  │   • API Image with App Insights SDK                                         │   │
│  │   • React Image with GA4 & App Insights JS                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Monitoring Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          TELEMETRY & EVENTS DATA FLOW                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

USER INTERACTIONS                           SYSTEM METRICS
      │                                           │
      ▼                                           ▼
┌─────────────┐                           ┌─────────────┐
│   Browser   │                           │  AKS Pods   │
│             │                           │             │
│ GA4 Events  │                           │ Performance │
│ Page Views  │                           │  Counters   │
│ User Actions│                           │ CPU/RAM/Disk│
└─────────────┘                           └─────────────┘
      │                                           │
      │                                           │
      ▼                                           ▼
┌─────────────────────────┐         ┌──────────────────────────┐
│   GOOGLE ANALYTICS 4    │         │  APPLICATION INSIGHTS    │
│                         │         │                          │
│ • Event Processing      │         │ • Metrics Aggregation    │
│ • Session Stitching     │         │ • Log Analysis           │
│ • User Attribution      │         │ • Dependency Tracking    │
│ • Conversion Tracking   │         │ • Exception Handling     │
└─────────────────────────┘         └──────────────────────────┘
      │                                           │
      ▼                                           ▼
┌─────────────────────────┐         ┌──────────────────────────┐
│    GA4 REPORTS          │         │   AZURE MONITOR          │
│                         │         │                          │
│ • Real-time Dashboard   │         │ • Live Metrics Stream    │
│ • User Flow            │         │ • Application Map        │
│ • Engagement Reports   │         │ • Failure Analysis       │
│ • Conversion Funnel    │         │ • Performance Insights   │
└─────────────────────────┘         └──────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────┐
                                   │    ALERT MANAGER         │
                                   │                          │
                                   │ • Threshold Monitoring   │
                                   │ • Alert Rule Evaluation │
                                   │ • Notification Dispatch │
                                   └──────────────────────────┘
                                              │
                ┌─────────────────────────────┼─────────────────────────────┐
                ▼                             ▼                             ▼
        ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
        │    Email     │            │  Mobile App  │            │   Webhook    │
        │ Notification │            │ Notification │            │ Integration  │
        └──────────────┘            └──────────────┘            └──────────────┘
```

## Golden Signals Monitoring Detail

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FOUR GOLDEN SIGNALS IMPLEMENTATION                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

1. LATENCY (Response Time)
┌──────────────────────────────────────────────────────────────────────────────────┐
│  API Response Times                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  P50: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  120ms                    │  │
│  │  P95: ████████████████████████████░░░░░░░░░░░░  450ms                    │  │
│  │  P99: ████████████████████████████████████░░░░  980ms                    │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│  Alert Thresholds: P95 > 5s (Warning), P99 > 10s (Critical)                     │
└──────────────────────────────────────────────────────────────────────────────────┘

2. ERROR RATE
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Request Success/Failure Ratio                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Success (2xx): ████████████████████████████████████████████░  98.5%      │  │
│  │  Client Errors (4xx): ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1.2%        │  │
│  │  Server Errors (5xx): ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0.3%        │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│  Alert Thresholds: Error Rate > 5% (Warning), 5xx > 1% (Critical)               │
└──────────────────────────────────────────────────────────────────────────────────┘

3. TRAFFIC (Request Volume)
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Requests Per Second (RPS)                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │   1000 │     ╱╲                                                            │  │
│  │    800 │    ╱  ╲                    ╱╲                                     │  │
│  │    600 │   ╱    ╲                  ╱  ╲                                    │  │
│  │    400 │  ╱      ╲____            ╱    ╲                                   │  │
│  │    200 │ ╱            ╲__________╱      ╲____________                      │  │
│  │      0 └────────────────────────────────────────────────                   │  │
│  │        00:00  04:00  08:00  12:00  16:00  20:00  24:00                    │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│  Current: 450 RPS | Peak Today: 980 RPS | Daily Average: 520 RPS                │
└──────────────────────────────────────────────────────────────────────────────────┘

4. CAPACITY (Resource Usage)
┌──────────────────────────────────────────────────────────────────────────────────┐
│  System Resource Utilization                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  CPU:    ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  45% (1.8/4 cores)│  │
│  │  Memory: ██████████████████████████░░░░░░░░░░░░░░░░░░░  62% (2.5/4 GB)   │  │
│  │  Disk:   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  20% (8/40 GB)    │  │
│  │  Network:████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  30% (300 Mbps)   │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│  Alert Thresholds: CPU > 80% (Warning), Memory > 85% (Critical)                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Alert Configuration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            CRITICAL ALERT CONFIGURATION                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                              ALERT RULES ENGINE                                  │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  SYSTEM DOWN ALERTS                                                         │ │
│  │  • Availability < 99%                    → Severity: Critical               │ │
│  │  • All health probes failing             → Severity: Critical               │ │
│  │  • Zero successful requests for 5+ min   → Severity: Critical               │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  PERFORMANCE ALERTS                                                         │ │
│  │  • P95 latency > 5 seconds               → Severity: Warning                │ │
│  │  • P99 latency > 10 seconds              → Severity: Critical               │ │
│  │  • Response time +300% from baseline     → Severity: Warning                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  ERROR RATE ALERTS                                                          │ │
│  │  • Total error rate > 5%                 → Severity: Warning                │ │
│  │  • 500-series errors > 1%                → Severity: Critical               │ │
│  │  • Critical endpoint failures             → Severity: Critical               │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  CAPACITY ALERTS                                                            │ │
│  │  • CPU usage > 80% for 10+ min           → Severity: Warning                │ │
│  │  • Memory usage > 85% sustained          → Severity: Critical               │ │
│  │  • Disk space < 10% available            → Severity: Critical               │ │
│  │  • Pod restart rate abnormal             → Severity: Warning                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           ACTION GROUP ROUTING                                   │
│                                                                                   │
│  Critical Severity  ──────►  Email + Mobile App + SMS + Webhook                 │
│  Warning Severity   ──────►  Email + Mobile App                                 │
│  Info Severity      ──────►  Email Only                                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Problem Discovery & Prototyping Branch

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         INNOVATION & PROTOTYPING WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              Git Repository Structure
┌──────────────────────────────────────────────────────────────────────────────────┐
│  main/master                                                                     │
│  ├── /api                    (Production API with monitoring)                    │
│  ├── /frontend               (Production React app with analytics)               │
│  ├── /k8s-manifests          (Production Kubernetes configs)                     │
│  ├── /monitoring             (App Insights & GA4 configs)                        │
│  └── /docs                   (Week 1 & 2 documentation)                          │
│                                                                                   │
│  feature/prototypes          (Problem Discovery Branch)                          │
│  ├── /proposals                                                                  │
│  │   ├── problem-1-internal-tools.md                                            │
│  │   ├── problem-2-customer-experience.md                                       │
│  │   └── problem-3-process-automation.md                                        │
│  ├── /prototype-1                                                                │
│  │   ├── /src                (Proof of concept code)                            │
│  │   ├── README.md           (Setup and demo instructions)                      │
│  │   └── demo-video.mp4      (Recorded demonstration)                           │
│  └── /feedback                                                                   │
│      ├── stakeholder-notes.md                                                   │
│      └── iteration-plan.md                                                      │
└──────────────────────────────────────────────────────────────────────────────────┘

                           Problem Discovery Process
┌──────────────────────────────────────────────────────────────────────────────────┐
│   IDENTIFY           PROPOSE            BUILD              VALIDATE              │
│                                                                                   │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│  │ Research │ ───► │ Solution │ ───► │Prototype │ ───► │ Feedback │           │
│  │ Problems │      │ Design   │      │  (1-2    │      │ & Iterate│           │
│  │          │      │          │      │  days)   │      │          │           │
│  └──────────┘      └──────────┘      └──────────┘      └──────────┘           │
│       │                 │                  │                  │                  │
│       ▼                 ▼                  ▼                  ▼                  │
│  3+ Problems      Proposals with      Working POC      Decision to              │
│  Identified       Value Props         Demonstrated     Proceed/Pivot            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Strategy Changes

Week 2 maintains the Week 1 infrastructure while adding monitoring layers:

### No Infrastructure Changes Required
- Same AKS cluster configuration
- Same ingress and service setup  
- Same authentication flow
- Same domain and SSL configuration

### SDK Integration Only
1. **Backend Changes:**
   - Add Application Insights SDK to package.json
   - Initialize SDK with instrumentation key
   - Add custom logging statements
   - No architectural changes needed

2. **Frontend Changes:**
   - Add GA4 and App Insights JS SDKs
   - Initialize in React app entry point
   - Add event tracking to components
   - No routing or structure changes

3. **Configuration Updates:**
   - Add environment variables for SDK keys
   - Update Kubernetes ConfigMaps
   - No new services or deployments needed

### Monitoring Resource Creation
- Application Insights resource (Azure Portal)
- Log Analytics workspace (linked to App Insights)
- Google Analytics 4 property (GA Console)
- Alert rules and action groups (Azure Monitor)

## Security & Compliance Considerations

### Data Privacy
- PII masking in Application Insights logs
- User consent for Google Analytics tracking
- GDPR compliance for EU users
- Data retention policies configuration

### Access Control
- Role-based access to monitoring dashboards
- Separate read-only accounts for stakeholders
- Audit logs for configuration changes
- Secure storage of instrumentation keys

### Cost Management
- Application Insights data ingestion limits
- Log retention period optimization
- Sampling configuration for high-traffic
- Alert notification quotas

## Collaboration Requirements

### 🔧 DevOps Team
- Create Application Insights resource
- Configure Log Analytics workspace
- Set up alert action groups
- Provide monitoring access permissions

### 👨‍💻 Development Team
- Instrument application code
- Define custom events and metrics
- Create monitoring dashboards
- Build prototype solutions

### 📊 Business Stakeholders
- Access to GA4 reports
- Review problem proposals
- Provide prototype feedback
- Approve solution priorities

## Success Metrics

### Technical Metrics
- 100% of API endpoints monitored
- < 1 minute alert notification time
- All Golden Signals tracked
- Zero monitoring blind spots

### Business Metrics
- User engagement tracked
- Conversion events defined
- Feature adoption measured
- Problem proposals validated

### Operational Metrics
- Mean time to detection (MTTD) < 5 minutes
- Alert accuracy > 95% (low false positives)
- Dashboard load time < 3 seconds
- Prototype feedback cycle < 1 week