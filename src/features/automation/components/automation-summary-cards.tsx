"use client";

import type { AutomationSummary } from "@/features/automation/types/endpoint";
import { formatNumber } from "@/features/automation/utils/format";

export function AutomationSummaryCards({
  summary,
  loading,
}: {
  summary: AutomationSummary | null;
  loading?: boolean;
}) {
  const cards = [
    { label: "Endpoints", value: summary ? formatNumber(summary.endpointCount) : "—" },
    { label: "Requests Today", value: summary ? formatNumber(summary.requestsToday) : "—" },
    { label: "Success Rate", value: summary ? `${summary.successRate}%` : "—" },
    { label: "Failed", value: summary ? formatNumber(summary.failedToday) : "—" },
    { label: "API Keys", value: summary ? formatNumber(summary.apiKeyCount) : "—" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" /> : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
