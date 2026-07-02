import { apiClient } from "@/services/api/client";

export type ChannelPaymentStatus = "configured" | "missing";

export const channelPaymentService = {
  async getStatus(channelId: string) {
    const response = await apiClient.get<{ status: ChannelPaymentStatus }>(
      `/channels/${channelId}/payment-status`,
    );
    return response.data!.status;
  },

  async createPaymentLink(channelId: string) {
    const response = await apiClient.post<{ url: string }>(`/channels/${channelId}/payment-link`, {});
    return response.data!.url;
  },
};
