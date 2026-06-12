import { apiClient } from "@/services/api/client";
import type { CreateTemplatePayload } from "@/features/broadcast/utils/build-meta-template";
import type { Campaign, CreateCampaignInput, WhatsAppTemplate } from "@/types/broadcast";

export type TemplateListParams = {
  search?: string;
  language?: string;
  category?: string;
  status?: string;
  device_id?: string;
};

export type CampaignOverview = {
  total_campaigns: number;
  total_sent: number;
  delivered_rate: number;
  read_rate: number;
  failed_rate: number;
};

export type CampaignReport = Campaign & {
  delivery_breakdown?: { label: string; value: number }[];
  hourly_performance?: { hour: number; count: number }[];
};

export const templateService = {
  async list(params?: TemplateListParams) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.language && params.language !== "all") query.set("language", params.language);
    if (params?.category && params.category !== "all") query.set("category", params.category);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.device_id) query.set("device_id", params.device_id);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<{ templates: WhatsAppTemplate[] }>(`/templates${suffix}`);
    return response.data?.templates ?? [];
  },

  async sync(deviceId: string) {
    const response = await apiClient.post<{ synced: number }>("/templates/sync", { device_id: deviceId });
    return response.data!;
  },

  async create(input: CreateTemplatePayload) {
    const response = await apiClient.post<WhatsAppTemplate>("/templates", input);
    return response.data!;
  },
};

export const campaignService = {
  async list() {
    const response = await apiClient.get<{ campaigns: Campaign[] }>("/campaigns");
    return response.data?.campaigns ?? [];
  },

  async overview() {
    const response = await apiClient.get<CampaignOverview>("/campaigns/reports/overview");
    return response.data!;
  },

  async create(input: CreateCampaignInput) {
    const response = await apiClient.post<Campaign>("/campaigns", input);
    return response.data!;
  },

  async send(id: string, contactIds?: string[]) {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/send`, {
      contact_ids: contactIds ?? [],
    });
    return response.data!;
  },

  async cancel(id: string) {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/cancel`, {});
    return response.data!;
  },

  async report(id: string) {
    const response = await apiClient.get<CampaignReport>(`/campaigns/${id}/report`);
    return response.data!;
  },
};
