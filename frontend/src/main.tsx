/*
========================================================

File:
main.tsx

Purpose:
Application entry point mounting the React app.

Responsibilities:
- Initializes TanStack QueryClient Provider
- Configures React Router Provider
- Wraps app with ErrorBoundary for production error resilience

Connected Files:
- index.html (mount target #root)
- src/app/router.tsx
- src/components/ErrorBoundary.tsx
- src/styles/index.css

Depends On:
- react, react-dom/client
- @tanstack/react-query
- react-router

Notes:
Sets up strict mode and base providers.

========================================================
*/

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "@/app/router";
import "@/styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
