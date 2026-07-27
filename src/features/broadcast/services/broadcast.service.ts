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
  page?: number;
  page_size?: number;
  /** @deprecated Use channel_id */
  device_id?: string;
};

export type TemplateListResult = {
  items: WhatsAppTemplate[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
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
  pagination?: TemplateListResult["pagination"];
};

export const templateService = {
  async listPage(params?: TemplateListParams): Promise<TemplateListResult> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.language && params.language !== "all") query.set("language", params.language);
    if (params?.category && params.category !== "all") query.set("category", params.category);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    const channelId = params?.channel_id ?? params?.device_id;
    if (channelId) query.set("channel_id", channelId);
    query.set("page", String(params?.page ?? 1));
    query.set("page_size", String(params?.page_size ?? 20));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<TemplateListResponse>(`/templates${suffix}`);
    const items = response.data?.items ?? response.data?.templates ?? [];
    const pagination = response.data?.pagination ?? {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 20,
      total: items.length,
      total_pages: 1,
    };
    return { items, pagination };
  },

  /** @deprecated Prefer listPage for server pagination. */
  async list(params?: TemplateListParams) {
    const result = await this.listPage(params);
    return result.items;
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

  async get(id: string) {
    const response = await apiClient.get<WhatsAppTemplate>(`/templates/${encodeURIComponent(id)}`);
    return response.data!;
  },

  async delete(id: string) {
    await apiClient.delete(`/templates/${encodeURIComponent(id)}`);
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
