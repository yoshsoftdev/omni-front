import { apiClient } from "@/services/api/client";
import type { Message } from "@/types/message";

export const messageService = {
  async list(conversationId: string) {
    const response = await apiClient.get<{ messages: Message[] }>(
      `/conversations/${conversationId}/messages`,
    );
    return response.data?.messages ?? [];
  },

  async send(conversationId: string, content: string) {
    const response = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data!;
  },
};
