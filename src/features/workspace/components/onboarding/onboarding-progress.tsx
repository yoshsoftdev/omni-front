"use client";

import { CheckCircle2 } from "lucide-react";

import type { OnboardingStep, OnboardingStepDefinition } from "@/features/workspace/types/onboarding";
import { cn } from "@/lib/utils";

type OnboardingProgressProps = {
  steps: OnboardingStepDefinition[];
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  progressPercent: number;
  estimatedMinutesRemaining: number;
};

export function OnboardingProgress({
  steps,
  currentStep,
  completedSteps,
  progressPercent,
  estimatedMinutesRemaining,
}: OnboardingProgressProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold">{progressPercent}%</span>
          <span className="text-xs text-muted-foreground">~{estimatedMinutesRemaining} min left</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((step) => {
          const done = completedSteps.includes(step.step);
          const active = step.step === currentStep;
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm",
                active && "bg-primary/5 font-medium text-primary",
                done && !active && "text-muted-foreground",
              )}
            >
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    active ? "border-primary text-primary" : "border-muted-foreground/40 text-muted-foreground",
                  )}
                >
                  {step.step}
                </span>
              )}
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
