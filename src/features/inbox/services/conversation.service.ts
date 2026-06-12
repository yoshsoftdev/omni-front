import { apiClient } from "@/services/api/client";
import type { Conversation, ConversationStatus } from "@/types/conversation";

export const conversationService = {
  async unreadCount() {
    const response = await apiClient.get<{ unread_count: number }>("/conversations/unread-count");
    return response.data?.unread_count ?? 0;
  },

  async list(params?: { search?: string; status?: ConversationStatus; assigned_to?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<{ conversations: Conversation[] }>(`/conversations${suffix}`);
    return response.data?.conversations ?? [];
  },

  async get(id: string) {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data!;
  },

  async assign(id: string, userId: string | null) {
    const response = await apiClient.patch<Conversation>(`/conversations/${id}/assign`, {
      user_id: userId,
    });
    return response.data!;
  },

  async updateStatus(id: string, status: ConversationStatus) {
    const response = await apiClient.patch<Conversation>(`/conversations/${id}/status`, { status });
    return response.data!;
  },

  async markRead(id: string) {
    const response = await apiClient.post<Conversation>(`/conversations/${id}/read`);
    return response.data!;
  },
};
