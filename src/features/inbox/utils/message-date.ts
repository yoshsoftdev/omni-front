import type { InboxChatMessage } from "@/features/inbox/types";

function toDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMessageDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const todayKey = toDayKey(now.toISOString());
  const messageKey = toDayKey(iso);

  if (messageKey === todayKey) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageKey === toDayKey(yesterday.toISOString())) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function applyMessageDateLabels(messages: InboxChatMessage[]): InboxChatMessage[] {
  let previousDayKey = "";

  return messages.map((message) => {
    const dayKey = toDayKey(message.sent_at);
    const showLabel = dayKey !== "" && dayKey !== previousDayKey;
    if (dayKey) previousDayKey = dayKey;

    return {
      ...message,
      date_label: showLabel ? formatMessageDateLabel(message.sent_at) : undefined,
    };
  });
}
