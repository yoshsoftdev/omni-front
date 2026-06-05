import { apiClient } from "@/services/api/client";
import type { Tag } from "@/types/tag";

export const tagService = {
  async list() {
    const response = await apiClient.get<{ tags: Tag[] }>("/tags");
    return response.data?.tags ?? [];
  },

  async create(name: string, color?: string) {
    const response = await apiClient.post<Tag>("/tags", { name, color });
    return response.data!;
  },

  async update(id: string, name: string, color?: string) {
    const response = await apiClient.patch<Tag>(`/tags/${id}`, { name, color });
    return response.data!;
  },

  async remove(id: string) {
    await apiClient.delete(`/tags/${id}`);
  },
};
