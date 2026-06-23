"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

export function ReportStatsCard({
  title,
  value,
  suffix,
  change,
  positive,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  change?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</span>
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      {change ? (
        <div className={cn("mt-2 flex items-center gap-1 text-xs", positive !== false ? "text-emerald-600" : "text-rose-600")}>
          {positive !== false ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </div>
      ) : null}
    </div>
  );
}
