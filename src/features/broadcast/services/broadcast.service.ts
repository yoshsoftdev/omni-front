import { apiClient } from "@/services/api/client";
import type { Broadcast, CreateBroadcastInput } from "@/types/broadcast";

export const broadcastService = {
  async list() {
    const response = await apiClient.get<{ broadcasts: Broadcast[] }>("/broadcasts");
    return response.data?.broadcasts ?? [];
  },

  async create(input: CreateBroadcastInput) {
    const response = await apiClient.post<Broadcast>("/broadcasts", input);
    return response.data!;
  },

  async cancel(id: string) {
    const response = await apiClient.post<Broadcast>(`/broadcasts/${id}/cancel`);
    return response.data!;
  },
};
