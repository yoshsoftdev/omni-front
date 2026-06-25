import { apiClient } from "@/services/api/client";
import { channelsApiService } from "@/features/channels/services/channels-api.service";
import type { OnboardingStatusResponse } from "@/types/device";

export const channelOnboardingService = {
  async getStatus(channelId: string): Promise<OnboardingStatusResponse> {
    const channel = await channelsApiService.getById(channelId);
    return {
      status: channel.status === "connected" ? "completed" : "pending",
      contacts_synced_count: 0,
      history_messages_synced: 0,
      history_sync_progress: channel.status === "connected" ? 100 : 0,
      completed_at: channel.status === "connected" ? channel.last_connected_at : undefined,
    };
  },

  async startSync(channelId: string): Promise<OnboardingStatusResponse> {
    try {
      await apiClient.get(`/channels/${channelId}/health`);
    } catch {
      // Health check is best-effort; status is derived from channel record.
    }
    return this.getStatus(channelId);
  },
};
