import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { v4 as uuidv4 } from "uuid";

class AppInsightsService {
  private static instance: AppInsightsService;
  private appInsights: ApplicationInsights | null = null;
  private reactPlugin: ReactPlugin;

  private constructor() {
    this.reactPlugin = new ReactPlugin();
  }

  public static init(): AppInsightsService {
    if (!AppInsightsService.instance) {
      AppInsightsService.instance = new AppInsightsService();
      AppInsightsService.instance.initialize();
    }
    return AppInsightsService.instance;
  }

  private initialize() {
    const connectionString =
      (import.meta as any).env.VITE_APPINSIGHTS_CONNECTION_STRING || "";

    if (!connectionString) {
      console.warn(
        "⚠️ [AppInsights] Connection string chưa được cấu hình. Telemetry sẽ không được gửi."
      );
      return;
    }

    try {
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString,
          extensions: [this.reactPlugin],
          enableAutoRouteTracking: true,
          disableAjaxTracking: false,
          disableFetchTracking: false,
          enableCorsCorrelation: true,
          disableExceptionTracking: false,
          enableUnhandledPromiseRejectionTracking: true,
          enablePerfMgr: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          samplingPercentage: 100,
          loggingLevelConsole: (import.meta as any).env.DEV ? 2 : 0,
        },
      });

      this.appInsights.loadAppInsights();

      this.appInsights.addTelemetryInitializer((envelope) => {
        if (envelope.tags) {
          envelope.tags["ai.cloud.role"] = "mindx-frontend";
          envelope.tags["ai.cloud.roleInstance"] = "browser";
        }
      });

      this.appInsights.trackPageView();

      console.info("✅ [AppInsights] Khởi tạo thành công.");
    } catch (error) {
      console.error("❌ [AppInsights] Lỗi khi khởi tạo:", error);
    }
  }

  public getReactPlugin(): ReactPlugin {
    return this.reactPlugin;
  }

  public trackEvent(name: string, properties: Record<string, any> = {}) {
    if (!this.appInsights) return;
    this.appInsights.trackEvent(
      { name },
      { timestamp: new Date().toISOString(), ...properties }
    );
  }

  public trackMetric(
    name: string,
    value: number,
    properties: Record<string, any> = {}
  ) {
    if (!this.appInsights) return;
    this.appInsights.trackMetric({ name, average: value }, properties);
  }

  public trackException(error: Error, properties: Record<string, any> = {}) {
    if (!this.appInsights) return;
    this.appInsights.trackException({ exception: error }, properties);
  }

  public trackDependency(
    name: string,
    url: string,
    duration: number,
    success: boolean
  ) {
    if (!this.appInsights) return;
    this.appInsights.trackDependencyData({
      id: uuidv4(),
      name,
      duration,
      success,
      responseCode: success ? 200 : 500,
      target: url,
      type: "HTTP",
    });
  }

  public setUser(userId: string) {
    if (!this.appInsights) return;
    this.appInsights.setAuthenticatedUserContext(userId);
  }

  public clearUser() {
    if (!this.appInsights) return;
    this.appInsights.clearAuthenticatedUserContext();
  }
}

export const AppInsights = AppInsightsService;
