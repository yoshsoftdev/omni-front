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

let activeConversationId: string | null = null;

export const presenceService = {
  getActiveConversationId() {
    return activeConversationId;
  },

  async open(conversationId: string) {
    const response = await apiClient.post<CollisionSnapshot>(
      `/conversations/${conversationId}/presence/open`,
      {},
    );
    activeConversationId = conversationId;
    return response.data!;
  },

  async close(conversationId: string) {
    try {
      const response = await apiClient.post<CollisionSnapshot>(
        `/conversations/${conversationId}/presence/close`,
        {},
      );
      return response.data!;
    } finally {
      if (activeConversationId === conversationId) {
        activeConversationId = null;
      }
    }
  },

  async closeActive() {
    const conversationId = activeConversationId;
    if (!conversationId) return;
    await this.close(conversationId).catch(() => {});
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
