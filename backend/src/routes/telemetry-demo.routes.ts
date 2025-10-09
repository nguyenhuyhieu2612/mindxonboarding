import { Router, Request, Response } from "express";
import {
  handleAsyncError,
  logger,
  trackEvent,
  trackMetric,
  trackException,
  trackDependency,
} from "../utils";

const router = Router();

/**
 * 📊 Demo 1: Custom Event Tracking
 * Test business event tracking
 */
router.get(
  "/event",
  handleAsyncError(async (req: Request, res: Response) => {
    const baseName = (req.query.name as string) || "event";
    const eventName = `demo-${baseName}`; // Add "demo-" prefix

    // Track custom event
    trackEvent(eventName, {
      triggeredBy: "demo-endpoint",
      timestamp: new Date().toISOString(),
      sourceIp: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
    });

    logger.info(`Demo: Tracked event '${eventName}'`);

    res.json({
      success: true,
      message: `Event '${eventName}' tracked successfully`,
      telemetry: {
        type: "customEvent",
        name: eventName,
        properties: {
          triggeredBy: "demo-endpoint",
          timestamp: new Date().toISOString(),
        },
      },
      azurePortalQuery: `customEvents | where name == "${eventName}" | order by timestamp desc`,
    });
  })
);

/**
 * 📈 Demo 2: Custom Metric Tracking
 * Test metric tracking with values
 */
router.get(
  "/metric",
  handleAsyncError(async (req: Request, res: Response) => {
    const baseName = (req.query.name as string) || "metric";
    const metricName = `demo-${baseName}`; // Add "demo-" prefix
    const value = parseFloat((req.query.value as string) || "100");

    // Track custom metric
    trackMetric(metricName, value, {
      triggeredBy: "demo-endpoint",
      unit: (req.query.unit as string) || "count",
    });

    logger.info(`Demo: Tracked metric '${metricName}' = ${value}`);

    res.json({
      success: true,
      message: `Metric '${metricName}' tracked successfully`,
      telemetry: {
        type: "customMetric",
        name: metricName,
        value: value,
        properties: {
          triggeredBy: "demo-endpoint",
          unit: req.query.unit || "count",
        },
      },
      azurePortalQuery: `customMetrics | where name == "${metricName}" | order by timestamp desc`,
    });
  })
);

/**
 * 📈 Demo 2: Custom Metric Tracking
 * Test metric tracking with values
 */
router.get(
  "/metric",
  handleAsyncError(async (req: Request, res: Response) => {
    const baseName = (req.query.name as string) || "metric";
    const metricName = `demo-${baseName}`; // Add "demo-" prefix
    const value = parseFloat((req.query.value as string) || "100");

    // Track custom metric
    trackMetric(metricName, value, {
      triggeredBy: "demo-endpoint",
      unit: (req.query.unit as string) || "count",
    });

    logger.info(`Demo: Tracked metric '${metricName}' = ${value}`);

    res.json({
      success: true,
      message: `Metric '${metricName}' tracked successfully`,
      telemetry: {
        type: "customMetric",
        name: metricName,
        value: value,
        properties: {
          triggeredBy: "demo-endpoint",
          unit: req.query.unit || "count",
        },
      },
      azurePortalQuery: `customMetrics | where name == "${metricName}" | order by timestamp desc`,
    });
  })
);

/**
 * ❌ Demo 3: Exception Tracking
 * Test handled error tracking
 */
router.get(
  "/error",
  handleAsyncError(async (req: Request, res: Response) => {
    const errorType = (req.query.type as string) || "demo-error";

    try {
      // Simulate an error
      if (errorType === "validation") {
        throw new Error("Validation failed: Invalid input data");
      } else if (errorType === "database") {
        throw new Error("Database connection timeout");
      } else if (errorType === "network") {
        throw new Error("Network request failed: Connection refused");
      } else {
        throw new Error(`Demo error: ${errorType}`);
      }
    } catch (error: any) {
      // Track exception
      trackException(error, {
        errorType: errorType,
        endpoint: "/api/demo/error",
        triggeredBy: "demo-endpoint",
        severity: "warning",
      });

      logger.warn(`Demo: Tracked exception '${errorType}'`);

      res.json({
        success: true,
        message: `Exception '${errorType}' tracked successfully (handled)`,
        telemetry: {
          type: "exception",
          error: error.message,
          errorType: errorType,
        },
        azurePortalQuery: `exceptions | where outerMessage contains "${errorType}" | order by timestamp desc`,
      });
    }
  })
);

/**
 * 🔗 Demo 4: Dependency Tracking
 * Test external dependency call tracking
 */
router.get(
  "/dependency",
  handleAsyncError(async (req: Request, res: Response) => {
    const baseName = (req.query.name as string) || "api";
    const dependencyName = `demo-${baseName}`; // Add "demo-" prefix
    const simulatedDuration = Math.floor(Math.random() * 500) + 100; // 100-600ms
    const success = Math.random() > 0.2; // 80% success rate

    // Simulate dependency call
    await new Promise((resolve) => setTimeout(resolve, simulatedDuration));

    // Track dependency
    trackDependency(
      dependencyName,
      "HTTP",
      `https://api.example.com/${dependencyName}`,
      simulatedDuration,
      success,
      success ? 200 : 500
    );

    logger.info(
      `Demo: Tracked dependency '${dependencyName}' (${simulatedDuration}ms)`
    );

    res.json({
      success: true,
      message: `Dependency '${dependencyName}' tracked successfully`,
      telemetry: {
        type: "dependency",
        name: dependencyName,
        duration: simulatedDuration,
        success: success,
        resultCode: success ? 200 : 500,
      },
      azurePortalQuery: `dependencies | where name == "${dependencyName}" | order by timestamp desc`,
    });
  })
);

/**
 * 🚶 Demo 5: User Journey Simulation
 * Track complete user flow with multiple telemetry types
 */
router.get(
  "/journey",
  handleAsyncError(async (req: Request, res: Response) => {
    const userId = `demo-user-${Date.now()}`;
    const events: string[] = [];

    // Step 1: User lands on homepage
    trackEvent("demo-page-view", {
      userId,
      page: "homepage",
      referrer: "demo-endpoint",
    });
    events.push("✅ Page view tracked");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 2: User views product
    trackEvent("demo-product-view", {
      userId,
      productId: "demo-product-123",
      category: "electronics",
    });
    events.push("✅ Product view tracked");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 3: User adds to cart
    trackEvent("demo-add-to-cart", {
      userId,
      productId: "demo-product-123",
      quantity: "2",
    });
    trackMetric("demo-cart-items-count", 2, { userId });
    events.push("✅ Add to cart tracked");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 4: Simulate payment API call
    const paymentDuration = Math.floor(Math.random() * 300) + 200;
    trackDependency(
      "demo-payment-gateway",
      "HTTP",
      "https://payment.example.com/process",
      paymentDuration,
      true,
      200
    );
    events.push("✅ Payment API call tracked");
    await new Promise((resolve) => setTimeout(resolve, paymentDuration));

    // Step 5: Order completed
    trackEvent("demo-order-completed", {
      userId,
      orderId: `order-${Date.now()}`,
      totalAmount: "259.98",
      items: "2",
    });
    trackMetric("demo-order-value", 259.98, {
      userId,
      currency: "USD",
    });
    events.push("✅ Order completion tracked");

    logger.info(`Demo: Completed user journey for ${userId}`);

    res.json({
      success: true,
      message: "User journey tracked successfully",
      userId: userId,
      steps: events,
      telemetryTracked: {
        events: [
          "demo-page-view",
          "demo-product-view",
          "demo-add-to-cart",
          "demo-order-completed",
        ],
        metrics: ["demo-cart-items-count", "demo-order-value"],
        dependencies: ["demo-payment-gateway"],
      },
      azurePortalQuery: `union customEvents, customMetrics, dependencies\n| where timestamp > ago(5m)\n| where customDimensions.userId == "${userId}" or customDimensions.userId == "${userId}"\n| order by timestamp asc`,
    });
  })
);

/**
 * 🎲 Demo 6: Random Load Generation
 * Generate random telemetry for testing
 */
router.get(
  "/load",
  handleAsyncError(async (req: Request, res: Response) => {
    const count = Math.min(parseInt((req.query.count as string) || "10"), 100);
    const telemetrySent: any[] = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();

      if (rand < 0.4) {
        // 40% events
        const eventNames = [
          "button-click",
          "form-submit",
          "page-view",
          "feature-used",
        ];
        const baseName =
          eventNames[Math.floor(Math.random() * eventNames.length)];
        const eventName = `demo-${baseName}`; // Add "demo-" prefix
        trackEvent(eventName, {
          index: String(i),
          batch: "demo-load-test",
        });
        telemetrySent.push({ type: "event", name: eventName });
      } else if (rand < 0.7) {
        // 30% metrics
        const metricNames = ["response-time", "queue-size", "active-users"];
        const baseName =
          metricNames[Math.floor(Math.random() * metricNames.length)];
        const metricName = `demo-${baseName}`; // Add "demo-" prefix
        const value = Math.floor(Math.random() * 1000);
        trackMetric(metricName, value, {
          index: String(i),
          batch: "demo-load-test",
        });
        telemetrySent.push({ type: "metric", name: metricName, value });
      } else {
        // 30% dependencies
        const depNames = ["database", "cache", "external-api"];
        const baseName = depNames[Math.floor(Math.random() * depNames.length)];
        const depName = `demo-${baseName}`; // Add "demo-" prefix
        const duration = Math.floor(Math.random() * 500) + 50;
        const success = Math.random() > 0.1;
        trackDependency(
          depName,
          "HTTP",
          `https://${baseName}.example.com`,
          duration,
          success,
          success ? 200 : 500
        );
        telemetrySent.push({
          type: "dependency",
          name: depName,
          duration,
          success,
        });
      }

      // Small delay between sends
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    logger.info(`Demo: Generated ${count} random telemetry items`);

    res.json({
      success: true,
      message: `Generated ${count} random telemetry items`,
      count: count,
      breakdown: {
        events: telemetrySent.filter((t) => t.type === "event").length,
        metrics: telemetrySent.filter((t) => t.type === "metric").length,
        dependencies: telemetrySent.filter((t) => t.type === "dependency")
          .length,
      },
      azurePortalQuery: `union customEvents, customMetrics, dependencies\n| where timestamp > ago(5m)\n| where customDimensions.batch == "demo-load-test"\n| summarize count() by itemType`,
    });
  })
);

/**
 * 📋 Demo Index: List all available demo endpoints
 */
router.get(
  "/",
  handleAsyncError(async (req: Request, res: Response) => {
    res.json({
      message: "Application Insights Telemetry Demo Endpoints",
      endpoints: [
        {
          path: "GET /api/demo/event",
          description: "Track a custom event",
          params: "?name=event-name",
          example:
            "curl http://localhost:3000/api/demo/event?name=button-click",
        },
        {
          path: "GET /api/demo/metric",
          description: "Track a custom metric",
          params: "?name=metric-name&value=100&unit=count",
          example:
            "curl http://localhost:3000/api/demo/metric?name=response-time&value=250&unit=ms",
        },
        {
          path: "GET /api/demo/error",
          description: "Track a handled exception",
          params: "?type=error-type (validation|database|network)",
          example: "curl http://localhost:3000/api/demo/error?type=validation",
        },
        {
          path: "GET /api/demo/dependency",
          description: "Track an external dependency call",
          params: "?name=dependency-name",
          example:
            "curl http://localhost:3000/api/demo/dependency?name=payment-api",
        },
        {
          path: "GET /api/demo/journey",
          description: "Simulate a complete user journey",
          params: "none",
          example: "curl http://localhost:3000/api/demo/journey",
        },
        {
          path: "GET /api/demo/load",
          description: "Generate random telemetry for load testing",
          params: "?count=10 (max 100)",
          example: "curl http://localhost:3000/api/demo/load?count=50",
        },
      ],
      azurePortal: {
        liveMetrics: "Portal → Application Insights → Live Metrics",
        logs: "Portal → Application Insights → Logs",
        sampleQueries: [
          "customEvents | where name startswith 'demo-' | summarize count() by name",
          "customMetrics | where name startswith 'demo-' | summarize avg(value) by name",
          "dependencies | where name startswith 'demo-' | summarize avg(duration) by name",
          "exceptions | where timestamp > ago(1h) | project timestamp, outerMessage",
        ],
      },
      naming: {
        convention: "All demo telemetry prefixed with 'demo-'",
        examples: [
          "?name=button-click → tracked as 'demo-button-click'",
          "?name=response-time → tracked as 'demo-response-time'",
          "User journey events: demo-page-view, demo-add-to-cart, etc.",
        ],
        reason:
          "Easy to filter demo data in Azure Portal: | where name startswith 'demo-'",
      },
      note: "⚠️  Set APPLICATIONINSIGHTS_CONNECTION_STRING to send data to Azure Portal. Without it, telemetry is tracked locally only.",
    });
  })
);

export default router;
