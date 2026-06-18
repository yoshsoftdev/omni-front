"use client";

import { CalendarDays } from "lucide-react";

import type { ContactActivity } from "@/types/contact";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ContactTimeline({ activities }: { activities: ContactActivity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="relative space-y-0">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex gap-3 pb-6 last:pb-0">
          {index < activities.length - 1 ? (
            <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
          ) : null}
          <div className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
          <div className="min-w-0 flex-1 rounded-lg border bg-background p-3">
            <div className="text-sm">{activity.text}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1 h-3 w-3" />
              {formatDateTime(activity.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
