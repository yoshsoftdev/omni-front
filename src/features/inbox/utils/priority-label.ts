import type { InboxConversation, InboxTag } from "@/features/inbox/types";

/** Prefer VIP/named tags; fall back to coarse priority_score bands. */
export function resolvePriorityLabel(conversation: InboxConversation): string | null {
  const tagged = conversation.tags.find((tag) => /vip|urgent|high|priority/i.test(tag.name));
  if (tagged) return tagged.name;

  const score = conversation.priority_score ?? 0;
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  if (score > 0) return "Normal";
  return null;
}

export function formatPriorityDisplay(tags: InboxTag[], priorityScore?: number): string | null {
  return resolvePriorityLabel({
    id: "",
    contact_id: "",
    contact_name: "",
    contact_phone: "",
    channel: "whatsapp",
    status: "open",
    unread_count: 0,
    tags,
    priority_score: priorityScore,
  });
}
