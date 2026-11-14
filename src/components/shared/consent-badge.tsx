import type { ConsentStatus } from "@/types/contact";
import { cn } from "@/lib/utils";

const LABELS: Record<ConsentStatus, string> = {
  opt_in: "Subscribed",
  opt_out: "Unsubscribed",
  unknown: "Unknown",
};

const STYLES: Record<ConsentStatus, string> = {
  opt_in: "bg-success-muted text-success-foreground",
  opt_out: "bg-error-muted text-error-foreground",
  unknown: "bg-muted text-muted-foreground",
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
