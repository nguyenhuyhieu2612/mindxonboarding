// index.tsx
import "./index.css";
import React from "react";
import { store } from "./store";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { reactPlugin } from "./app-insights.ts";
import {
  AppInsightsContext,
  AppInsightsErrorBoundary,
} from "@microsoft/applicationinsights-react-js";
import { initializeGA4 } from "@/lib/analytics.ts";

import "./app-insights.ts";
initializeGA4();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppInsightsContext.Provider value={reactPlugin}>
      <AppInsightsErrorBoundary
        appInsights={reactPlugin}
        onError={() => <h1>Sorry, something went wrong.</h1>}
      >
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </AppInsightsErrorBoundary>
    </AppInsightsContext.Provider>
  </React.StrictMode>
);
