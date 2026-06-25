import { apiClient } from "@/services/api/client";
import {
  normalizeSegment,
  normalizeSegmentGetResponse,
} from "@/features/segments/mappers/segment.mapper";
import type { Segment } from "@/features/segments/types/segment";

type PageResponse<T> = {
  items?: T[];
  segments?: T[];
};

type CreateSegmentInput = {
  name: string;
  description?: string;
  color?: string;
  is_dynamic?: boolean;
};

export const segmentService = {
  async list(): Promise<Segment[]> {
    const response = await apiClient.get<PageResponse<Segment>>("/segments");
    const rows = response.data?.items ?? response.data?.segments ?? [];
    return rows.map((row) => normalizeSegment(row));
  },

  async getById(id: string): Promise<Segment | undefined> {
    try {
      const response = await apiClient.get(`/segments/${id}`);
      return normalizeSegmentGetResponse(response.data as Parameters<typeof normalizeSegmentGetResponse>[0]);
    } catch {
      return undefined;
    }
  },

  async create(input: CreateSegmentInput): Promise<Segment> {
    const response = await apiClient.post("/segments", {
      name: input.name,
      description: input.description ?? "",
      color: input.color ?? "#6366f1",
      is_dynamic: input.is_dynamic ?? true,
      // Backend requires at least one rule when creating segments.
      rules: [
        {
          field: "source",
          operator: "equals",
          value: "whatsapp",
          sort_order: 0,
        },
      ],
    });
    return normalizeSegmentGetResponse(response.data as Parameters<typeof normalizeSegmentGetResponse>[0]);
  },

  async remove(id: string): Promise<void> {
    if (!id) {
      throw new Error("Segment id is required");
    }
    await apiClient.delete(`/segments/${id}`);
  },

  async search(query: string): Promise<Segment[]> {
    const segments = await this.list();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return segments;
    return segments.filter(
      (segment) =>
        segment.name.toLowerCase().includes(normalized) ||
        segment.description.toLowerCase().includes(normalized),
    );
  },
};
