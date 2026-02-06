import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import * as Sentry from "@sentry/react";

import { AuthProvider } from "@skolist/auth";
import { Toaster } from "@skolist/ui";
import { ThemeProvider } from "./context/ThemeProvider";
import App from "./App";
import "./index.css";
import "katex/dist/katex.min.css";

// const queryClient = new QueryClient();

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: import.meta.env.VITE_DEPLOYMENT_ENV
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* <QueryClientProvider client={queryClient}> */}
      <AuthProvider apiUrl={import.meta.env.VITE_FASTAPI_URL}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <App />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
      {/* </QueryClientProvider> */}
    </BrowserRouter>
    <Analytics />
  </StrictMode>
);
