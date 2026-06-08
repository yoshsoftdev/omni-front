import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatsCard({
  title,
  value,
  change,
  changeDirection = "up",
  suffix,
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeDirection?: "up" | "down";
  suffix?: string;
  className?: string;
}) {
  const isUp = changeDirection === "up";

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold tracking-tight">
          {value}
          {suffix ? <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span> : null}
        </div>
        {change ? (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isUp ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {change}
          </div>
        ) : null}
      </div>
    </div>
  );
}
