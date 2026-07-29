import type { InboxActivityEvent, InboxChatMessage } from "@/features/inbox/types";
import { formatMessageDateLabel } from "@/features/inbox/utils/message-date";

/** Activity types rendered as audit events in the conversation timeline. */
export const TIMELINE_SYSTEM_TYPES = new Set<InboxActivityEvent["type"]>([
  "opened",
  "assigned",
  "reassigned",
  "closed",
  "reopened",
  "tag_added",
  "tag_removed",
  "note_added",
]);

export type TimelineItem =
  | { kind: "message"; id: string; at: string; data: InboxChatMessage }
  | { kind: "system"; id: string; at: string; data: InboxActivityEvent }
  | { kind: "date"; id: string; at: string; label: string };

function toMillis(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildThreadTimeline(
  messages: InboxChatMessage[],
  activities: InboxActivityEvent[],
): TimelineItem[] {
  const systemEvents = activities.filter((event) => TIMELINE_SYSTEM_TYPES.has(event.type));

  const entries: Array<{ kind: "message" | "system"; id: string; at: string; sort: number }> = [
    ...messages.map((message) => ({
      kind: "message" as const,
      id: message.id,
      at: message.sent_at,
      sort: toMillis(message.sent_at),
    })),
    ...systemEvents.map((event) => ({
      kind: "system" as const,
      id: `system-${event.id}`,
      at: event.created_at,
      sort: toMillis(event.created_at),
    })),
  ].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort;
    // Stable: messages before system events at same ms; then by id.
    if (a.kind !== b.kind) return a.kind === "message" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  const messageById = new Map(messages.map((m) => [m.id, m]));
  const activityByTimelineId = new Map<string, InboxActivityEvent>(
    systemEvents.map((event) => [`system-${event.id}`, event]),
  );

  const items: TimelineItem[] = [];
  let lastDay = "";

  for (const entry of entries) {
    const key = dayKey(entry.at);
    if (key && key !== lastDay) {
      lastDay = key;
      items.push({
        kind: "date",
        id: `date-${key}`,
        at: entry.at,
        label: formatMessageDateLabel(entry.at),
      });
    }

    if (entry.kind === "message") {
      const data = messageById.get(entry.id);
      if (!data) continue;
      items.push({ kind: "message", id: entry.id, at: entry.at, data });
      continue;
    }

    const data = activityByTimelineId.get(entry.id);
    if (!data) continue;
    items.push({ kind: "system", id: entry.id, at: entry.at, data });
  }

  return items;
}
