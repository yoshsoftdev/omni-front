"use client";

import { EmptyState } from "@/components/shared/empty-state";

export function SegmentAnalyticsPanel() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <EmptyState message="Segment analytics will appear here once available from the API." />
    </div>
  );
}
