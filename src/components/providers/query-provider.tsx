"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const CLEAR_SESSION_CACHE_EVENT = "omni-chan:clear-session-cache";

export function dispatchClearSessionCache() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLEAR_SESSION_CACHE_EVENT));
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    function handleClear() {
      client.clear();
    }
    window.addEventListener(CLEAR_SESSION_CACHE_EVENT, handleClear);
    return () => window.removeEventListener(CLEAR_SESSION_CACHE_EVENT, handleClear);
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
