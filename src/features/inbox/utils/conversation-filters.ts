import type { InboxConversation, InboxTab } from "@/features/inbox/types";
import { conversationsMatchId } from "@/features/inbox/utils/realtime-conversation";

export function isClosedConversation(conversation: InboxConversation) {
  return conversation.status === "closed";
}

export function isUnassignedOpenConversation(conversation: InboxConversation) {
  return !isClosedConversation(conversation) && !conversation.assigned_to;
}

export function isAssignedToAgent(conversation: InboxConversation, agentId: string) {
  return Boolean(agentId) && conversation.assigned_to === agentId && !isClosedConversation(conversation);
}

export function filterConversationsByTab(
  conversations: InboxConversation[],
  tab: InboxTab,
  currentUserId?: string,
) {
  switch (tab) {
    case "open":
    case "unassigned":
      return conversations.filter(isUnassignedOpenConversation);
    case "assigned":
      return conversations.filter((conversation) => isAssignedToAgent(conversation, currentUserId ?? ""));
    case "closed":
      return conversations.filter(isClosedConversation);
    default:
      return conversations;
  }
}

export function computeInboxTabCounts(conversations: InboxConversation[], currentUserId?: string) {
  return {
    open: filterConversationsByTab(conversations, "open", currentUserId).length,
    assigned: filterConversationsByTab(conversations, "assigned", currentUserId).length,
    unassigned: filterConversationsByTab(conversations, "unassigned", currentUserId).length,
    closed: filterConversationsByTab(conversations, "closed", currentUserId).length,
    all: conversations.length,
  };
}

export function patchConversationStatus(
  conversations: InboxConversation[],
  conversationId: string,
  status: InboxConversation["status"],
): InboxConversation[] {
  if (!conversationId) return conversations;
  return conversations.map((conversation) =>
    conversationsMatchId(conversation.id, conversationId) ? { ...conversation, status } : conversation,
  );
}
