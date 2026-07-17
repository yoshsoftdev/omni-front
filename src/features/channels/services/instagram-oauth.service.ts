import { apiClient } from "@/services/api/client";

export type InstagramConnectURL = {
  authorization_url: string;
  state: string;
  expires_at: string;
};

export type InstagramStatus = {
  connected: boolean;
  username?: string;
  account_type?: string;
  token_expiry?: string;
};

export type ChannelStatusReport = {
  channels: Array<{
    type: string;
    connected: boolean;
    display_name?: string;
  }>;
};

export const instagramOAuthService = {
  async getConnectUrl(returnUrl?: string) {
    const query = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : "";
    const response = await apiClient.get<InstagramConnectURL>(`/channels/instagram/connect-url${query}`);
    return response.data!;
  },

  async disconnect() {
    await apiClient.delete("/channels/instagram/connection");
  },

  async getStatus() {
    const response = await apiClient.get<InstagramStatus>("/channels/instagram/status");
    return response.data!;
  },

  async getChannelStatus() {
    const response = await apiClient.get<ChannelStatusReport>("/channels/status");
    return response.data!;
  },
};
