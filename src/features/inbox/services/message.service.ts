import { apiClient } from "@/services/api/client";
import type { Message } from "@/types/message";

type PageResponse<T> = {
  items?: T[];
  messages?: T[];
};

export const messageService = {
  async list(conversationId: string) {
    const response = await apiClient.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages?page_size=100`,
    );
    return response.data?.items ?? response.data?.messages ?? [];
  },

  async send(conversationId: string, content: string) {
    const response = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data!;
  },
};
