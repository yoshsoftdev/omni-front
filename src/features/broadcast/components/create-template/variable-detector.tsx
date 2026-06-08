"use client";

import type { DetectedVariable } from "@/features/broadcast/types/create-template";

export function VariableDetector({ variables }: { variables: DetectedVariable[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm font-semibold">Variabel</div>
      <p className="mt-1 text-xs text-muted-foreground">
        {variables.length} variabel ditemukan dalam template
      </p>

      {variables.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada variabel terdeteksi.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {variables.map((variable) => (
            <div
              key={variable.key}
              className="flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <span className="font-mono text-xs font-medium text-[#0F9D8A]">
                {variable.placeholder}
              </span>
              <span className="text-muted-foreground">Contoh:</span>
              <span className="font-medium">{variable.sampleValue}</span>
              <span className="ml-auto inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                {variable.fieldLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
