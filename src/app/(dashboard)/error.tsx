"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/empty-state";

/** Catches render errors so one broken page does not blank the whole app. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      message="This page could not be displayed. Try again, or reload if the problem persists."
      onRetry={reset}
      className="m-6"
    />
  );
}
