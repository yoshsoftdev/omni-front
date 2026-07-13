import { apiClient } from "@/services/api/client";
import { apiConversationToInbox } from "@/features/inbox/lib/inbox-delta";
import type { Conversation, ConversationStatus } from "@/types/conversation";
import type { InboxMessage, SendInboxMessageInput } from "@/types/inbox";
import type { InboxTab } from "@/features/inbox/types";

export interface InboxListParams {
  cursor?: string;
  limit?: number;
  status?: ConversationStatus;
  view?: string;
  assigned_to?: string;
  channel_id?: string;
  channel_type?: string;
  search?: string;
}

export interface InboxListResponse {
  conversations: Conversation[];
  next_cursor?: string;
  has_more: boolean;
}

export function inboxFilterKey(params: InboxListParams): string {
  return JSON.stringify(params);
}

export function inboxTabToParams(
  tab: InboxTab,
  options: {
    channelId?: string;
    assignedTo?: string;
    search?: string;
    currentUserId?: string;
  } = {},
): InboxListParams {
  const params: InboxListParams = {
    limit: 50,
    search: options.search?.trim() || undefined,
    channel_type: options.channelId && options.channelId !== "all" ? options.channelId : undefined,
  };

  switch (tab) {
    case "open":
      params.status = "open";
      params.view = "all";
      break;
    case "unassigned":
      params.view = "unassigned";
      break;
    case "assigned":
      params.view = "mine";
      break;
    case "closed":
      params.view = "closed";
      break;
    default:
      params.view = "all";
      break;
  }

  if ((tab === "all" || tab === "closed") && options.assignedTo && options.assignedTo !== "all") {
    params.assigned_to = options.assignedTo;
  }

  return params;
}

export const inboxService = {
  async listMessages() {
    const response = await apiClient.get<{ messages: InboxMessage[] }>("/inbox/messages");
    return response.data?.messages ?? [];
  },

  async sendMessage(input: SendInboxMessageInput) {
    const response = await apiClient.post<InboxMessage>("/inbox/messages", input);
    return response.data!;
  },

  async list(params: InboxListParams = {}) {
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    if (params.view) query.set("view", params.view);
    if (params.assigned_to) query.set("assigned_to", params.assigned_to);
    if (params.channel_id) query.set("channel_id", params.channel_id);
    if (params.channel_type) query.set("channel_type", params.channel_type);
    if (params.search) query.set("search", params.search);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<InboxListResponse>(`/inbox${suffix}`);
    const data = response.data!;
    return {
      conversations: (data.conversations ?? []).map((row) => apiConversationToInbox(row)),
      nextCursor: data.next_cursor ?? null,
      hasMore: Boolean(data.has_more),
    };
  },
};
