import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { step: 1, label: "Informasi Template" },
  { step: 2, label: "Komponen Template" },
  { step: 3, label: "Preview & Submit" },
] as const;

export function TemplateCreateStepper({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-wrap items-center gap-6 border-b pb-6">
      {steps.map((item) => {
        const done = activeStep > item.step;
        const active = activeStep === item.step;
        return (
          <div key={item.step} className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium",
                done && "border-[#0F9D8A] bg-[#0F9D8A] text-white",
                active && !done && "border-[#0F9D8A] text-[#0F9D8A]",
                !done && !active && "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : item.step}
            </div>
            <span
              className={cn(
                "text-sm",
                active || done ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
