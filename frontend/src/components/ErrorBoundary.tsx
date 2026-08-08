/*
========================================================

File:
components/ErrorBoundary.tsx

Purpose:
React Error Boundary for catching and handling runtime errors.

Responsibilities:
- Catches JavaScript errors in child component tree
- Displays a fallback UI instead of crashing
- Provides a retry mechanism
- Logs errors for debugging

Connected Files:
- src/main.tsx (wraps the entire app)
- src/app/router.tsx (wraps route groups)

Depends On:
- react

Notes:
This is a class component because Error Boundaries require
getDerivedStateFromError and componentDidCatch lifecycle methods.

========================================================
*/

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="mb-6 p-4 rounded-full bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-200 mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-500 max-w-md mb-6">
            An unexpected error occurred. Please try again or contact support if the problem
            persists.
          </p>
          {this.state.error && (
            <pre className="text-xs text-zinc-600 bg-zinc-900/60 rounded-lg p-3 mb-6 max-w-md overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <Button
            variant="secondary"
            onClick={this.handleRetry}
            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-700 border-zinc-800"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
