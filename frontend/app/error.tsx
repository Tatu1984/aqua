"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }

    // TODO: Send error to error tracking service (Sentry, etc.)
    // logErrorToService(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        <p className="mb-8 text-gray-600">
          We apologize for the inconvenience. An unexpected error occurred while
          loading this page. Please try again or return to the home page.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-8 rounded-lg bg-gray-100 p-4 text-left">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Error Details (Development Only):
            </p>
            <pre className="overflow-auto text-xs text-red-600">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center gap-2"
          >
            <Home className="h-5 w-5" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
