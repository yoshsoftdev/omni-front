import type { ConsentStatus } from "@/types/contact";
import { cn } from "@/lib/utils";

const LABELS: Record<ConsentStatus, string> = {
  opt_in: "Subscribed",
  opt_out: "Unsubscribed",
  unknown: "Unknown",
};

const STYLES: Record<ConsentStatus, string> = {
  opt_in: "bg-emerald-100 text-emerald-700",
  opt_out: "bg-red-100 text-red-700",
  unknown: "bg-slate-100 text-slate-600",
};

export function ConsentBadge({ status, className }: { status: ConsentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status], className)}>
      {LABELS[status]}
    </span>
  );
}

export function consentLabel(status: ConsentStatus) {
  if (status === "opt_in") return "Subscribed";
  if (status === "opt_out") return "Unsubscribed";
  return "Unknown";
}
