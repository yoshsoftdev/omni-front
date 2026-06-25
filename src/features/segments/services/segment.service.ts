import { apiClient } from "@/services/api/client";
import type { Segment, SegmentRule } from "@/features/segments/types/segment";

type ApiSegment = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  contact_count?: number;
  created_at?: string;
  updated_at?: string;
  rules?: Array<{
    id?: string;
    field: string;
    operator: string;
    value: string;
  }>;
};

type PageResponse<T> = {
  items: T[];
};

function mapApiSegment(dto: ApiSegment): Segment {
  const rules: SegmentRule[] = (dto.rules ?? []).map((rule, index) => ({
    id: rule.id ?? `rule_${index}`,
    field: rule.field as SegmentRule["field"],
    operator: rule.operator as SegmentRule["operator"],
    value: rule.value,
  }));

  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    color: dto.color ?? "#6366f1",
    contact_count: dto.contact_count ?? 0,
    created_at: dto.created_at ?? new Date(0).toISOString(),
    updated_at: dto.updated_at ?? dto.created_at ?? new Date(0).toISOString(),
    rules,
  };
}

export const segmentService = {
  async list(): Promise<Segment[]> {
    const response = await apiClient.get<PageResponse<ApiSegment>>("/segments?page_size=100");
    return (response.data?.items ?? []).map(mapApiSegment);
  },

  async getById(id: string): Promise<Segment | undefined> {
    try {
      const response = await apiClient.get<ApiSegment & { rules?: ApiSegment["rules"] }>(`/segments/${id}`);
      return mapApiSegment(response.data!);
    } catch {
      return undefined;
    }
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
