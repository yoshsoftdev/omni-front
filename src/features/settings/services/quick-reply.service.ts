import { apiClient } from "@/services/api/client";
import type { QuickReply, QuickReplyInput } from "@/features/settings/types/quick-reply";

type PageResponse<T> = {
  items?: T[];
};

function normalizeQuickReply(raw: QuickReply & { Content?: string; Text?: string; Category?: string }): QuickReply {
  const content = raw.content ?? raw.Content ?? raw.text ?? raw.Text ?? "";
  return {
    id: raw.id,
    category: raw.category ?? raw.Category ?? "General",
    content,
    text: content,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const quickReplyService = {
  async list(search = "") {
    const query = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}&page_size=100`
      : "?page_size=100";
    const response = await apiClient.get<PageResponse<QuickReply>>(`/quick-replies${query}`);
    const rows = response.data?.items ?? [];
    return rows.map((row) => normalizeQuickReply(row));
  },

  async create(input: QuickReplyInput) {
    const response = await apiClient.post<QuickReply>("/quick-replies", {
      category: input.category,
      content: input.content,
    });
    return normalizeQuickReply(response.data!);
  },

  async update(id: string, input: QuickReplyInput) {
    const response = await apiClient.patch<QuickReply>(`/quick-replies/${id}`, {
      category: input.category,
      content: input.content,
    });
    return normalizeQuickReply(response.data!);
  },

  async remove(id: string) {
    await apiClient.delete(`/quick-replies/${id}`);
  },
};
