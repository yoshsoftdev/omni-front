"use client";

import {
  SEGMENT_CITY_STATS,
  SEGMENT_GENDER_STATS,
  SEGMENT_GROWTH_STATS,
} from "@/features/contacts/mock-data";

export function SegmentAnalyticsPanel() {
  const maxGrowth = Math.max(...SEGMENT_GROWTH_STATS.map((g) => g.count));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Gender Distribution</h3>
        <div className="mt-4 flex items-center justify-center">
          <div
            className="relative h-32 w-32 rounded-full"
            style={{
              background: `conic-gradient(${SEGMENT_GENDER_STATS.map((g, i) => {
                const start = SEGMENT_GENDER_STATS.slice(0, i).reduce((s, x) => s + x.value, 0);
                return `${g.color} ${start}% ${start + g.value}%`;
              }).join(", ")})`,
            }}
          />
        </div>
        <div className="mt-4 space-y-1">
          {SEGMENT_GENDER_STATS.map((g) => (
            <div key={g.label} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                {g.label}
              </span>
              <span>{g.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Top Cities</h3>
        <div className="mt-4 space-y-3">
          {SEGMENT_CITY_STATS.map((c) => (
            <div key={c.city}>
              <div className="flex justify-between text-sm">
                <span>{c.city}</span>
                <span>{c.count}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c.count / SEGMENT_CITY_STATS[0].count) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Contact Growth</h3>
        <div className="mt-4 flex h-32 items-end gap-2">
          {SEGMENT_GROWTH_STATS.map((g) => (
            <div key={g.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-primary" style={{ height: `${(g.count / maxGrowth) * 100}%` }} />
              <span className="text-[10px] text-muted-foreground">{g.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
