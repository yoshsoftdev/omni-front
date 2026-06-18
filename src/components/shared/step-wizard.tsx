"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string | number;
  label: string;
};

export function StepWizard({
  steps,
  currentStep,
  className,
}: {
  steps: WizardStep[];
  currentStep: string | number;
  className?: string;
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === currentStep;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                done || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>{step.label}</span>
            {index < steps.length - 1 ? <div className="mx-2 hidden h-px w-8 bg-border sm:block" /> : null}
          </div>
        );
      })}
    </div>
  );
}
