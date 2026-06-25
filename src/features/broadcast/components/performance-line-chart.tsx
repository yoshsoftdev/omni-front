"use client";

import type { PerformanceDataPoint } from "@/features/broadcast/types/campaign";

const COLORS = {
  sent: "#0F9D8A",
  read: "#3B82F6",
  failed: "#EF4444",
};

function buildPath(
  points: PerformanceDataPoint[],
  key: keyof Pick<PerformanceDataPoint, "sent" | "read" | "failed">,
  width: number,
  height: number,
  maxY: number,
) {
  const stepX = width / Math.max(points.length - 1, 1);
  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point[key] / maxY) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export function PerformanceLineChart({ data }: { data: PerformanceDataPoint[] }) {
  const width = 640;
  const height = 200;
  const padding = { top: 8, right: 8, bottom: 24, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxY = Math.max(
    ...data.flatMap((d) => [d.sent, d.read, d.failed]),
    1,
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.sent }} />
          Terkirim
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.read }} />
          Terbaca
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.failed }} />
          Gagal
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Performa pengiriman">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              y1={chartH * ratio}
              x2={chartW}
              y2={chartH * ratio}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
            />
          ))}

          <path
            d={buildPath(data, "sent", chartW, chartH, maxY)}
            fill="none"
            stroke={COLORS.sent}
            strokeWidth={2}
          />
          <path
            d={buildPath(data, "read", chartW, chartH, maxY)}
            fill="none"
            stroke={COLORS.read}
            strokeWidth={2}
          />
          <path
            d={buildPath(data, "failed", chartW, chartH, maxY)}
            fill="none"
            stroke={COLORS.failed}
            strokeWidth={2}
          />
        </g>

        {data.map((point, index) => {
          const stepX = chartW / Math.max(data.length - 1, 1);
          const x = padding.left + index * stepX;
          return (
            <text
              key={point.date}
              x={x}
              y={height - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
