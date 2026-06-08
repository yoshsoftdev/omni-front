import { apiClient } from "@/services/api/client";
import type { Campaign, CreateCampaignInput, WhatsAppTemplate } from "@/types/broadcast";

export const templateService = {
  async list(deviceId?: string) {
    const suffix = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
    const response = await apiClient.get<{ templates: WhatsAppTemplate[] }>(`/templates${suffix}`);
    return response.data?.templates ?? [];
  },

  async sync(deviceId: string) {
    const response = await apiClient.post<{ synced: number }>("/templates/sync", { device_id: deviceId });
    return response.data!;
  },
};

export const campaignService = {
  async list() {
    const response = await apiClient.get<{ campaigns: Campaign[] }>("/campaigns");
    return response.data?.campaigns ?? [];
  },

  async create(input: CreateCampaignInput) {
    const response = await apiClient.post<Campaign>("/campaigns", input);
    return response.data!;
  },

  async send(id: string) {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/send`, {});
    return response.data!;
  },

  async report(id: string) {
    const response = await apiClient.get<Campaign>(`/campaigns/${id}/report`);
    return response.data!;
  },
};
