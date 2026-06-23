"use client";

import { CheckCircle2, Circle } from "lucide-react";

import type { ReadinessCheck } from "@/features/workspace/types/workspace-readiness";
import { cn } from "@/lib/utils";

type OnboardingChecklistProps = {
  items: ReadinessCheck[];
  title?: string;
  description?: string;
};

export function OnboardingChecklist({
  items,
  title = "Setup checklist",
  description,
}: OnboardingChecklistProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            {item.completed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className={cn(!item.completed && "text-muted-foreground")}>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
