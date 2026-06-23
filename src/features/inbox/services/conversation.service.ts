import { apiClient } from "@/services/api/client";
import type { Conversation, ConversationStatus } from "@/types/conversation";

type PageResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export const conversationService = {
  async unreadCount() {
    const response = await apiClient.get<{ unread_conversations: number }>("/dashboard");
    return response.data?.unread_conversations ?? 0;
  },

  async list(params?: { search?: string; status?: ConversationStatus; assigned_to?: string; page?: number; page_size?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<PageResponse<Conversation>>(`/conversations${suffix}`);
    return response.data?.items ?? [];
  },

  async get(id: string) {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data!;
  },

  async assign(id: string, userId: string | null) {
    const response = await apiClient.post<Conversation>(`/conversations/${id}/assign`, {
      user_id: userId,
    });
    return response.data!;
  },

  async updateStatus(id: string, status: ConversationStatus) {
    const response = await apiClient.patch<Conversation>(`/conversations/${id}/status`, { status });
    return response.data!;
  },

  async markRead(id: string) {
    return this.updateStatus(id, "closed");
  },
};
