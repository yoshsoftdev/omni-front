import { apiClient } from "@/services/api/client";

export interface CollisionAgent {
  agent_id: string;
  agent_name: string;
}

export interface CollisionSnapshot {
  conversation_id: string;
  agent_id?: string;
  agent_name?: string;
  viewers: CollisionAgent[];
  typing: CollisionAgent[];
}

export const presenceService = {
  async open(conversationId: string) {
    const response = await apiClient.post<CollisionSnapshot>(
      `/conversations/${conversationId}/presence/open`,
      {},
    );
    return response.data!;
  },

  async close(conversationId: string) {
    const response = await apiClient.post<CollisionSnapshot>(
      `/conversations/${conversationId}/presence/close`,
      {},
    );
    return response.data!;
  },

  async typing(conversationId: string, action: "start" | "stop") {
    const response = await apiClient.post<CollisionSnapshot>(
      `/conversations/${conversationId}/presence/typing`,
      { action },
    );
    return response.data!;
  },

  async get(conversationId: string) {
    const response = await apiClient.get<CollisionSnapshot>(`/conversations/${conversationId}/presence`);
    return response.data!;
  },
};
