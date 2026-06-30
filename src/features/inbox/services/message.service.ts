import { apiClient } from "@/services/api/client";
import { normalizeMessage } from "@/features/inbox/mappers/message.mapper";
import type { Message, SendMessageInput } from "@/types/message";

type PageResponse<T> = {
  items?: T[];
  messages?: T[];
};

export const messageService = {
  async list(conversationId: string) {
    const response = await apiClient.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages?page_size=100`,
    );
    const rows = response.data?.items ?? response.data?.messages ?? [];
    return rows.map((row) => normalizeMessage(row));
  },

  async send(conversationId: string, input: SendMessageInput) {
    const response = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
      content: input.content ?? "",
      storage_object_id: input.storage_object_id,
    });
    return normalizeMessage(response.data!);
  },
};
