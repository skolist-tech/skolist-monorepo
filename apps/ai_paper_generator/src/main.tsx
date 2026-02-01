import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react"

import { AuthProvider } from "@skolist/auth";
import { Toaster } from "@skolist/ui";
import { ThemeProvider } from "./context/ThemeProvider";
import App from "./App";
import "./index.css";
import "katex/dist/katex.min.css";

// const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* <QueryClientProvider client={queryClient}> */}
        <AuthProvider>
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
