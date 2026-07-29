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
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        closed
          ? "border-[#E5E7EB] bg-[#F6F7F9] text-[#6B7280] dark:border-border dark:bg-muted"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-[#6B7280]" : "bg-emerald-600")}
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
          "inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F6F7F9] px-2 py-0.5 text-[11px] font-medium text-[#6B7280] dark:border-border dark:bg-muted",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF]" aria-hidden />
        Unassigned
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-[12rem] items-center gap-1.5 truncate rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[11px] font-medium text-[#111111] dark:border-border dark:bg-card dark:text-foreground",
        className,
      )}
    >
      <User className="h-3 w-3 shrink-0 text-[#6B7280]" aria-hidden />
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
        "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
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
        "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        className,
      )}
      title={`Waiting ${label}`}
    >
      <span aria-hidden>⏱</span>
      Waiting {label}
    </span>
  );
}
