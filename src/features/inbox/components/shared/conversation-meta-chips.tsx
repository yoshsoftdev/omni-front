"use client";

import { User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { InboxConversationStatus } from "@/features/inbox/types";

export function ConversationStatusChip({
  status,
  className,
}: {
  status: InboxConversationStatus;
  className?: string;
}) {
  const closed = status === "closed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        closed
          ? "border-border bg-background text-muted-foreground dark:bg-muted"
          : "border-success-border bg-success-muted text-success-foreground",
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-muted-foreground" : "bg-success")}
        aria-hidden
      />
      {closed ? "Closed" : "Open"}
    </span>
  );
}

export function AssigneeChip({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name?.trim()) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-muted",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
        Unassigned
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-[12rem] items-center gap-1.5 truncate rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <User className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function PriorityChip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning-foreground",
        className,
      )}
    >
      <span aria-hidden>🏷</span>
      {label}
    </span>
  );
}

export function WaitingChip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-muted px-2 py-0.5 text-xs font-medium tabular-nums text-warning-foreground",
        className,
      )}
      title={`Waiting ${label}`}
    >
      <span aria-hidden>⏱</span>
      Waiting {label}
    </span>
  );
}

/** "5h left" / "12m left" for the Meta 24h reply window. */
export function formatWindowRemaining(remainingMs: number): string {
  const hours = Math.floor(remainingMs / 3_600_000);
  return hours >= 1 ? `${hours}h left` : `${Math.max(1, Math.floor(remainingMs / 60_000))}m left`;
}

const WINDOW_WARN_MS = 2 * 3_600_000;

/** Meta 24h customer-care window: free-text replies only while it is open. */
export function ReplyWindowChip({
  allowed,
  remainingMs,
  className,
}: {
  allowed: boolean;
  remainingMs: number;
  className?: string;
}) {
  const tone = !allowed
    ? "border-error-border bg-error-muted text-error-foreground"
    : remainingMs < WINDOW_WARN_MS
      ? "border-warning-border bg-warning-muted text-warning-foreground"
      : "border-border bg-background text-muted-foreground dark:bg-muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
        tone,
        className,
      )}
      title={
        allowed
          ? "Free-text replies are allowed until 24 hours after the customer's last message"
          : "24-hour window closed: only approved templates can be sent"
      }
    >
      {allowed ? `24h window · ${formatWindowRemaining(remainingMs)}` : "24h window closed"}
    </span>
  );
}
