import { cn } from "@/lib/utils";

type StatusVariant =
  | "approved"
  | "pending"
  | "rejected"
  | "scheduled"
  | "running"
  | "completed"
  | "cancelled"
  | "default";

const variantStyles: Record<StatusVariant, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  rejected: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  running: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  completed: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  cancelled: "border-border bg-muted text-muted-foreground",
  default: "border-border bg-muted text-muted-foreground",
};

function statusToVariant(status: string): StatusVariant {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "approved";
  if (normalized === "PENDING") return "pending";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "SCHEDULED" || normalized === "TERJADWAL") return "scheduled";
  if (normalized === "RUNNING" || normalized === "BERJALAN") return "running";
  if (normalized === "COMPLETED" || normalized === "SELESAI") return "completed";
  if (normalized === "CANCELLED" || normalized === "DIBATALKAN") return "cancelled";
  return "default";
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = statusToVariant(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className,
      )}
    >
      {status}
    </span>
  );
}
