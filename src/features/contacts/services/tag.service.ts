import { apiClient } from "@/services/api/client";
import type { ContactTag } from "@/types/contact";
import type { Tag } from "@/types/tag";

type PageResponse<T> = {
  items?: T[];
  tags?: T[];
};

function mapTagDto(tag: Tag): ContactTag {
  return {
    id: tag.id,
    name: tag.name,
    description: "",
    color: tag.color,
    contact_count: 0,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
    created_by: "—",
  };
}

export const tagService = {
  async getById(id: string) {
    const response = await apiClient.get<Tag>(`/tags/${id}`);
    return mapTagDto(response.data!);
  },

  async list() {
    const response = await apiClient.get<PageResponse<Tag>>("/tags?page_size=100");
    return (response.data?.items ?? response.data?.tags ?? []).map(mapTagDto);
  },

  async create(name: string, color?: string) {
    const response = await apiClient.post<Tag>("/tags", { name, color });
    return mapTagDto(response.data!);
  },

  async update(id: string, name: string, color?: string) {
    const response = await apiClient.patch<Tag>(`/tags/${id}`, { name, color });
    return mapTagDto(response.data!);
  },

  async remove(id: string) {
    await apiClient.delete(`/tags/${id}`);
  },
};
