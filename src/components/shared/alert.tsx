"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

/** Light tint bg + dark status text (WCAG AA) — never light text on solid fills. */
const styles: Record<AlertVariant, string> = {
  info: "border-info-border bg-info-muted text-info-foreground",
  success: "border-success-border bg-success-muted text-success-foreground",
  warning: "border-warning-border bg-warning-muted text-warning-foreground",
  error: "border-error-border bg-error-muted text-error-foreground",
};

const icons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

/**
 * Semantic alert only — place inside white cards, never as page/section chrome.
 */
export function Alert({
  variant = "info",
  children,
  className,
  title,
}: {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-2 rounded-lg border p-3 text-xs", styles[variant], className)}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title && "mt-1")}>{children}</div>
      </div>
    </div>
  );
}
