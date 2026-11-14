"use client";

import type { ReactNode } from "react";
import { Lock, MessageCircle, RotateCcw, StickyNote, Tag, UserCheck } from "lucide-react";

import type { InboxActivityEvent } from "@/features/inbox/types";
import { cn } from "@/lib/utils";

const EVENT_ICON: Partial<Record<InboxActivityEvent["type"], ReactNode>> = {
  assigned: <UserCheck className="h-3.5 w-3.5" />,
  reassigned: <UserCheck className="h-3.5 w-3.5" />,
  closed: <Lock className="h-3.5 w-3.5" />,
  reopened: <RotateCcw className="h-3.5 w-3.5" />,
  opened: <MessageCircle className="h-3.5 w-3.5" />,
  tag_added: <Tag className="h-3.5 w-3.5" />,
  tag_removed: <Tag className="h-3.5 w-3.5" />,
  note_added: <StickyNote className="h-3.5 w-3.5" />,
};

function formatEventTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface SystemEventProps {
  event: InboxActivityEvent;
  className?: string;
}

/** Audit timeline row — visually separated from chat bubbles. */
export function SystemEvent({ event, className }: SystemEventProps) {
  const time = formatEventTime(event.created_at);

  return (
    <div
      role="listitem"
      className={cn("flex items-center gap-3 py-1", className)}
      aria-label={`${event.description}${time ? `, ${time}` : ""}`}
    >
      <div className="h-px flex-1 bg-border" />
      <div className="inline-flex max-w-[min(100%,28rem)] items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-center shadow-sm">
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          {EVENT_ICON[event.type] ?? <MessageCircle className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 text-xs font-medium text-foreground">
          {event.description}
        </span>
        {time ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{time}</span> : null}
      </div>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
