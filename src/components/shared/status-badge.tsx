"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusBadgeTone = "success" | "warning" | "error" | "neutral" | "info";

/** Light tint + dark text badges (Do pattern from Aturan Pemilihan Warna). */
const tones: Record<StatusBadgeTone, string> = {
  success: "border-success-border bg-success-muted text-success-foreground",
  warning: "border-warning-border bg-warning-muted text-warning-foreground",
  error: "border-error-border bg-error-muted text-error-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-info-border bg-info-muted text-info-foreground",
};

function toneFromStatusLabel(status: string): StatusBadgeTone {
  const normalized = status.trim().toLowerCase();
  if (
    normalized === "connected" ||
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "completed" ||
    normalized === "sent" ||
    normalized === "delivered" ||
    normalized === "read" ||
    normalized === "success" ||
    normalized === "configured"
  ) {
    return "success";
  }
  if (
    normalized === "pending" ||
    normalized === "connecting" ||
    normalized === "queued" ||
    normalized === "sending" ||
    normalized === "scheduled" ||
    normalized === "needs attention" ||
    normalized === "missing"
  ) {
    return "warning";
  }
  if (
    normalized === "failed" ||
    normalized === "rejected" ||
    normalized === "error" ||
    normalized === "restricted" ||
    normalized === "cancelled" ||
    normalized === "disabled"
  ) {
    return "error";
  }
  return "neutral";
}

type StatusBadgeProps = {
  tone?: StatusBadgeTone;
  /** Legacy API used by templates/broadcast pages */
  status?: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function StatusBadge({ tone, status, children, className, icon }: StatusBadgeProps) {
  const resolvedTone = tone ?? (status ? toneFromStatusLabel(status) : "neutral");
  const label = children ?? status ?? "—";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        tones[resolvedTone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
