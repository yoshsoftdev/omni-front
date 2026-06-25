import { apiClient } from "@/services/api/client";
import { normalizeTag } from "@/features/contacts/mappers/tag.mapper";
import type { ContactTag } from "@/types/contact";

type PageResponse<T> = {
  items?: T[];
  tags?: T[];
};

export const tagService = {
  async getById(id: string) {
    const response = await apiClient.get<ContactTag>(`/tags/${id}`);
    return normalizeTag(response.data!);
  },

  async list() {
    const response = await apiClient.get<PageResponse<ContactTag>>("/tags?page_size=100");
    const rows = response.data?.items ?? response.data?.tags ?? [];
    return rows.map((row) => normalizeTag(row));
  },

  async create(name: string, color?: string, description?: string) {
    const response = await apiClient.post<ContactTag>("/tags", {
      name,
      color,
      ...(description ? { description } : {}),
    });
    return normalizeTag(response.data!);
  },

  async update(id: string, name: string, color?: string, description?: string) {
    const response = await apiClient.patch<ContactTag>(`/tags/${id}`, {
      name,
      color,
      ...(description !== undefined ? { description } : {}),
    });
    return normalizeTag(response.data!);
  },

  async remove(id: string) {
    if (!id) {
      throw new Error("Tag id is required");
    }
    await apiClient.delete(`/tags/${id}`);
  },

  async assignToContact(tagId: string, contactId: string) {
    if (!tagId || !contactId) {
      throw new Error("Tag id and contact id are required");
    }
    await apiClient.post(`/tags/${tagId}/contacts/${contactId}`);
  },
};
