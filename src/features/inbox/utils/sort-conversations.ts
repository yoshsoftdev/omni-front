import type { InboxConversation } from "@/features/inbox/types";

export type ConversationListSort = "recent" | "waiting";

function toMillis(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Client-side sort of the currently loaded conversation page. */
export function sortConversations(
  conversations: InboxConversation[],
  sort: ConversationListSort,
): InboxConversation[] {
  const items = [...conversations];
  if (sort === "waiting") {
    return items.sort((a, b) => {
      const aWait = toMillis(a.waiting_since);
      const bWait = toMillis(b.waiting_since);
      if (aWait === 0 && bWait === 0) {
        return toMillis(b.last_message_at) - toMillis(a.last_message_at);
      }
      if (aWait === 0) return 1;
      if (bWait === 0) return -1;
      return aWait - bWait; // oldest waiting first
    });
  }

  return items.sort((a, b) => toMillis(b.last_message_at) - toMillis(a.last_message_at));
}
