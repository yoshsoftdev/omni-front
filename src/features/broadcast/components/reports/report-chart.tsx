"use client";

import type { PerformanceTrendPoint } from "@/features/broadcast/types/campaign";

const COLORS = {
  sent: "#8B5CF6",
  delivered: "#0F9D8A",
  read: "#3B82F6",
  replies: "#F59E0B",
};

function buildPath(
  points: PerformanceTrendPoint[],
  key: keyof Pick<PerformanceTrendPoint, "sent" | "delivered" | "read" | "replies">,
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

export function ReportChart({ data }: { data: PerformanceTrendPoint[] }) {
  const width = 720;
  const height = 220;
  const padding = { top: 8, right: 8, bottom: 28, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxY = Math.max(...data.flatMap((d) => [d.sent, d.delivered, d.read, d.replies]), 1);

  const legend = [
    { key: "sent" as const, label: "Sent", color: COLORS.sent },
    { key: "delivered" as const, label: "Delivered", color: COLORS.delivered },
    { key: "read" as const, label: "Read", color: COLORS.read },
    { key: "replies" as const, label: "Replies", color: COLORS.replies },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        {legend.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Performance trend">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1={0} y1={chartH * ratio} x2={chartW} y2={chartH * ratio} stroke="hsl(var(--border))" strokeDasharray="4 4" />
          ))}
          {legend.map((item) => (
            <path key={item.key} d={buildPath(data, item.key, chartW, chartH, maxY)} fill="none" stroke={item.color} strokeWidth={2} />
          ))}
        </g>
        {data.map((point, index) => {
          const stepX = chartW / Math.max(data.length - 1, 1);
          const x = padding.left + index * stepX;
          return (
            <text key={point.date} x={x} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
