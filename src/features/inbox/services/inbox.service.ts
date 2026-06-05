import { apiClient } from "@/services/api/client";
import type { InboxMessage, SendInboxMessageInput } from "@/types/inbox";

export const inboxService = {
  async listMessages() {
    const response = await apiClient.get<{ messages: InboxMessage[] }>("/inbox/messages");
    return response.data?.messages ?? [];
  },

  async sendMessage(input: SendInboxMessageInput) {
    const response = await apiClient.post<InboxMessage>("/inbox/messages", input);
    return response.data!;
  },
};
