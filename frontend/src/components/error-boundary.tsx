import React from "react";
import { appInsights } from "../app-insights";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Error Boundary Component
 * Step 3.3: Catches React lifecycle errors and tracks them to Application Insights
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Step 3.3: Track exception to Application Insights
    appInsights.trackException({
      exception: error,
      properties: {
        componentStack: errorInfo.componentStack || "N/A",
        location: window.location.href,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
        environment: import.meta.env.MODE,
        errorBoundary: "true",
        timestamp: new Date().toISOString(),
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
