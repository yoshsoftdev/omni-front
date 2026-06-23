import { MOCK_SEGMENTS } from "@/features/segments/mock/segment-mock-data";
import type { Segment } from "@/features/segments/types/segment";

export const segmentService = {
  async list(): Promise<Segment[]> {
    return [...MOCK_SEGMENTS];
  },

  async getById(id: string): Promise<Segment | undefined> {
    return MOCK_SEGMENTS.find((segment) => segment.id === id);
  },

  async search(query: string): Promise<Segment[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [...MOCK_SEGMENTS];
    return MOCK_SEGMENTS.filter(
      (segment) =>
        segment.name.toLowerCase().includes(normalized) ||
        segment.description.toLowerCase().includes(normalized),
    );
  },
};
