import { apiClient } from "@/services/api/client";
import type { CreateTemplatePayload } from "@/features/broadcast/utils/build-meta-template";
import { parseCampaignDto, parseCampaignDtoList } from "@/features/broadcast/boundary/campaign.boundary";
import { normalizeCampaignDto } from "@/features/broadcast/mappers/campaign.mapper";
import type { Campaign } from "@/features/broadcast/types/campaign";
import type { CampaignDTO, CreateCampaignInput, WhatsAppTemplate } from "@/types/broadcast";

export type TemplateListParams = {
  search?: string;
  language?: string;
  category?: string;
  status?: string;
  channel_id?: string;
  /** @deprecated Use channel_id */
  device_id?: string;
};

export type CampaignOverview = {
  total_campaigns: number;
  total_sent: number;
  delivered_rate: number;
  read_rate: number;
  failed_rate: number;
};

type CampaignReportDTO = CampaignDTO & {
  delivery_breakdown?: { label: string; value: number }[];
  hourly_performance?: { hour: number; count: number }[];
};

export type CampaignReport = Campaign & {
  delivery_breakdown?: { label: string; value: number }[];
  hourly_performance?: { hour: number; count: number }[];
};

type TemplateListResponse = {
  items?: WhatsAppTemplate[];
  templates?: WhatsAppTemplate[];
};

export const templateService = {
  async list(params?: TemplateListParams) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.language && params.language !== "all") query.set("language", params.language);
    if (params?.category && params.category !== "all") query.set("category", params.category);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    const channelId = params?.channel_id ?? params?.device_id;
    if (channelId) query.set("channel_id", channelId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<TemplateListResponse>(`/templates${suffix}`);
    return response.data?.items ?? response.data?.templates ?? [];
  },

  async sync(channelId: string) {
    const response = await apiClient.post<{ synced: number }>(
      `/templates/sync?channel_id=${encodeURIComponent(channelId)}`,
      {},
    );
    return response.data!;
  },

  async create(input: CreateTemplatePayload) {
    const response = await apiClient.post<WhatsAppTemplate>("/templates", input);
    return response.data!;
  },
};

export const campaignService = {
  async list(): Promise<Campaign[]> {
    const response = await apiClient.get<{ campaigns?: CampaignDTO[]; items?: CampaignDTO[] }>(
      "/campaigns",
    );
    const rows = response.data?.items ?? response.data?.campaigns ?? [];
    return parseCampaignDtoList(rows.map((row) => normalizeCampaignDto(row)));
  },

  async overview() {
    const response = await apiClient.get<CampaignOverview>("/campaigns/reports/overview");
    return response.data!;
  },

  async create(input: CreateCampaignInput): Promise<Campaign> {
    const response = await apiClient.post<unknown>("/campaigns", input);
    return parseCampaignDto(normalizeCampaignDto(response.data));
  },

  async send(id: string, contactIds?: string[]): Promise<Campaign> {
    const response = await apiClient.post<unknown>(`/campaigns/${id}/send`, {
      contact_ids: contactIds ?? [],
    });
    return parseCampaignDto(normalizeCampaignDto(response.data));
  },

  async cancel(id: string): Promise<Campaign> {
    const response = await apiClient.post<unknown>(`/campaigns/${id}/cancel`, {});
    return parseCampaignDto(normalizeCampaignDto(response.data));
  },

  async report(id: string): Promise<CampaignReport> {
    const response = await apiClient.get<CampaignReportDTO>(`/campaigns/${id}/report`);
    const dto = response.data!;
    return {
      ...parseCampaignDto(dto),
      delivery_breakdown: dto.delivery_breakdown,
      hourly_performance: dto.hourly_performance,
    };
  },
};
