"use client";

import type { ReactNode } from "react";
import {
  Mail,
  MessageCircle,
  MousePointerClick,
  Tag,
  UserCheck,
  UserMinus,
} from "lucide-react";

import type { InboxActivityEvent } from "@/features/inbox/types";

const EVENT_ICONS: Record<InboxActivityEvent["type"], ReactNode> = {
  opened: <MessageCircle className="h-3.5 w-3.5" />,
  agent_replied: <UserCheck className="h-3.5 w-3.5" />,
  customer_replied: <MessageCircle className="h-3.5 w-3.5" />,
  campaign_received: <Mail className="h-3.5 w-3.5" />,
  campaign_clicked: <MousePointerClick className="h-3.5 w-3.5" />,
  tag_added: <Tag className="h-3.5 w-3.5" />,
  tag_removed: <UserMinus className="h-3.5 w-3.5" />,
};

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContactTimeline({ events }: { events: InboxActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < events.length - 1 ? (
            <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
          ) : null}
          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-primary">
            {EVENT_ICONS[event.type]}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm">{event.description}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
