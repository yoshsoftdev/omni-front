import { apiClient } from "@/services/api/client";
import type { InboxAnalytics } from "@/features/reports/utils/inbox-analytics";

export const inboxAnalyticsService = {
  async get(params: { from: Date; to: Date; tz: string; channelId?: string }): Promise<InboxAnalytics> {
    const query = new URLSearchParams({ from: params.from.toISOString(), to: params.to.toISOString(), tz: params.tz });
    if (params.channelId) query.set("channel_id", params.channelId);
    const response = await apiClient.get<InboxAnalytics>(`/reports/inbox?${query.toString()}`);
    return response.data!;
  },
};
