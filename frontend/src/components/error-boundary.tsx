import { Component, ReactNode, ErrorInfo } from "react";
import { AppInsights } from "@/app-insights";

const appInsights = AppInsights.init();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    appInsights.trackException(error, {
      componentStack: errorInfo.componentStack || "N/A",
      errorBoundary: "true",
    });

    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#fcf8f8] group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <div className="px-40 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
                <h2 className="text-[#1b0d0d] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                  Oops! Something went wrong.
                </h2>
                <p className="text-[#1b0d0d] text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
                  An unexpected error occurred. Please try again later.
                </p>
                <div className="flex px-4 py-3 justify-center">
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#ec1313] text-[#fcf8f8] text-sm font-bold leading-normal tracking-[0.015em]">
                    <span className="truncate">Go Back Home</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
