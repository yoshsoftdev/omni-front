import { apiClient } from "@/services/api/client";

export type ChannelHealthResult = {
  healthy: boolean;
  checks: {
    token: boolean;
    waba: boolean;
    phone: boolean;
    templates_api: boolean;
    template_sync?: boolean;
  };
};

export const channelHealthService = {
  async check(channelId: string) {
    const response = await apiClient.get<ChannelHealthResult>(`/channels/${channelId}/health`);
    return response.data!;
  },
};
