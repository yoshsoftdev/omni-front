import type { InboxConversation } from "@/features/inbox/types";

function toMillis(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Sort key: priority_score DESC, last_message_at DESC, id DESC */
export function compareConversations(a: InboxConversation, b: InboxConversation): number {
  const scoreDiff = (b.priority_score ?? 0) - (a.priority_score ?? 0);
  if (scoreDiff !== 0) return scoreDiff;

  const timeDiff = toMillis(b.last_message_at) - toMillis(a.last_message_at);
  if (timeDiff !== 0) return timeDiff;

  return b.id.localeCompare(a.id);
}

export function findInsertIndex(
  orderedIds: string[],
  byId: Record<string, InboxConversation>,
  conversation: InboxConversation,
): number {
  let low = 0;
  let high = orderedIds.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const existing = byId[orderedIds[mid]];
    if (!existing) {
      low = mid + 1;
      continue;
    }
    if (compareConversations(conversation, existing) < 0) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

export function insertConversation(
  orderedIds: string[],
  byId: Record<string, InboxConversation>,
  conversation: InboxConversation,
): string[] {
  const without = orderedIds.filter((id) => id !== conversation.id);
  const index = findInsertIndex(without, byId, conversation);
  const next = [...without];
  next.splice(index, 0, conversation.id);
  return next;
}

export function reorderConversation(
  orderedIds: string[],
  byId: Record<string, InboxConversation>,
  conversation: InboxConversation,
): string[] {
  return insertConversation(orderedIds, byId, conversation);
}
