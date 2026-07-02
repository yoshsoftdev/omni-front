import { apiClient } from "@/services/api/client";
import { normalizeConversation } from "@/features/inbox/mappers/conversation.mapper";
import type { InboxActivityEvent, InboxWorkspaceNote } from "@/features/inbox/types";
import type { Conversation, ConversationStatus } from "@/types/conversation";

type PageResponse<T> = {
  items?: T[];
  conversations?: T[];
  pagination?: {
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
    const rows = response.data?.items ?? response.data?.conversations ?? [];
    return rows.map((row) => normalizeConversation(row));
  },

  async get(id: string) {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return normalizeConversation(response.data!);
  },

  async assign(id: string, userId: string | null) {
    const response = await apiClient.post<Conversation>(`/conversations/${id}/assign`, {
      assignee_id: userId,
    });
    return normalizeConversation(response.data!);
  },

  async listActivities(id: string) {
    const response = await apiClient.get<InboxActivityApiItem[]>(`/conversations/${id}/activities`);
    return (response.data ?? []).map(mapActivity);
  },

  async listNotes(id: string) {
    const response = await apiClient.get<InboxNoteApiItem[]>(`/conversations/${id}/notes`);
    return (response.data ?? []).map(mapNote);
  },

  async createNote(id: string, content: string) {
    const response = await apiClient.post<InboxNoteApiItem>(`/conversations/${id}/notes`, { content });
    return mapNote(response.data!);
  },

  async updateStatus(id: string, status: ConversationStatus) {
    const response = await apiClient.patch<Conversation>(`/conversations/${id}/status`, { status });
    return normalizeConversation(response.data!);
  },

  async markRead(id: string) {
    const response = await apiClient.post<Conversation>(`/conversations/${id}/read`, {});
    return normalizeConversation(response.data!);
  },
};

type InboxActivityApiItem = {
  id?: string;
  ID?: string;
  type?: InboxActivityEvent["type"];
  Type?: InboxActivityEvent["type"];
  description?: string;
  Description?: string;
  created_at?: string;
  CreatedAt?: string;
};

type InboxNoteApiItem = {
  id?: string;
  ID?: string;
  content?: string;
  Content?: string;
  author_name?: string;
  AuthorName?: string;
  created_at?: string;
  CreatedAt?: string;
};

function mapActivity(raw: InboxActivityApiItem): InboxActivityEvent {
  return {
    id: raw.id ?? raw.ID ?? "",
    type: raw.type ?? raw.Type ?? "opened",
    description: raw.description ?? raw.Description ?? "",
    created_at: raw.created_at ?? raw.CreatedAt ?? new Date().toISOString(),
  };
}

function mapNote(raw: InboxNoteApiItem): InboxWorkspaceNote {
  return {
    id: raw.id ?? raw.ID ?? "",
    category: "internal",
    content: raw.content ?? raw.Content ?? "",
    author: raw.author_name ?? raw.AuthorName ?? "Agent",
    created_at: raw.created_at ?? raw.CreatedAt ?? new Date().toISOString(),
  };
}
