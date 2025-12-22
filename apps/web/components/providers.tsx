"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";

const STALE_TIME_MS = 60 * 1000; // 1 minute
const GC_TIME_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 2;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            gcTime: GC_TIME_MS,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && "status" in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < MAX_RETRIES;
            },
          },
          mutations: {
            retry: false,
            onError: (error) => {
              toast.error(error instanceof Error ? error.message : "An error occurred");
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
