import type { InboxConversation } from "@/features/inbox/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `GET /inbox` returns `assigned_to` without `assignee_name`, so the display name
 * must be resolved from the workspace member directory.
 */
export function resolveAssigneeName(
  conversation: Pick<InboxConversation, "assigned_to" | "assignee_name">,
  agentNameById: Map<string, string>,
): string | undefined {
  const assignedTo = conversation.assigned_to?.trim();
  const existing = conversation.assignee_name?.trim();

  if (existing && !UUID_PATTERN.test(existing)) return existing;
  if (!assignedTo) return undefined;

  return agentNameById.get(assignedTo) ?? "Assigned agent";
}

export function withResolvedAssignee(
  conversation: InboxConversation,
  agentNameById: Map<string, string>,
): InboxConversation {
  const resolved = resolveAssigneeName(conversation, agentNameById);
  if (resolved === conversation.assignee_name) return conversation;
  return { ...conversation, assignee_name: resolved };
}
