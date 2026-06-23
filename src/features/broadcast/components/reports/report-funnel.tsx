"use client";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export function ReportFunnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const widthPct = Math.max((step.value / max) * 100, 8);
        const prev = index > 0 ? steps[index - 1].value : step.value;
        const dropPct = prev > 0 ? ((step.value / prev) * 100).toFixed(1) : "100.0";

        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground">
                {step.value.toLocaleString()} ({dropPct}%)
              </span>
            </div>
            <div className="h-8 w-full rounded-md bg-muted/40">
              <div
                className="flex h-full items-center rounded-md px-3 text-xs font-medium text-white transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: step.color }}
              >
                {step.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
