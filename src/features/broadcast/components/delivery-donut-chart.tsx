"use client";

import type { DeliveryBreakdown } from "@/features/broadcast/mock/mock-data";

const SEGMENT_COLORS = ["#0F9D8A", "#3B82F6", "#F59E0B", "#EF4444"];

export function DeliveryDonutChart({ data }: { data: DeliveryBreakdown[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Status pengiriman">
        <g transform="translate(70, 70) rotate(-90)">
          {data.map((segment, index) => {
            const portion = total > 0 ? segment.value / total : 0;
            const dash = portion * circumference;
            const offset = cumulative * circumference;
            cumulative += portion;
            return (
              <circle
                key={segment.label}
                r={radius}
                cx={0}
                cy={0}
                fill="transparent"
                stroke={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                strokeWidth={18}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </g>
        <text x="70" y="66" textAnchor="middle" className="fill-foreground text-lg font-semibold">
          {total.toLocaleString("id-ID")}
        </text>
        <text x="70" y="82" textAnchor="middle" className="fill-muted-foreground text-[10px]">
          Total
        </text>
      </svg>

      <div className="space-y-2 text-sm">
        {data.map((segment, index) => (
          <div key={segment.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-medium">{segment.value.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
