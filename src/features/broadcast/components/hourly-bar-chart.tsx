"use client";

import type { HourlyPerformance } from "@/features/broadcast/types/campaign";

export function HourlyBarChart({ data }: { data: HourlyPerformance[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="flex h-40 items-end gap-1">
        {data.map((item) => {
          const height = (item.count / max) * 100;
          return (
            <div key={item.hour} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-primary/80"
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${item.hour}:00 — ${item.count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
