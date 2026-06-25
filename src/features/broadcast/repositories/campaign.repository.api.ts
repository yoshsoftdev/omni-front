import { parseCampaignDto, parseCampaignDtoList } from "@/features/broadcast/boundary/campaign.boundary";
import type {
  CampaignDashboardStats,
  CampaignQueryRepository,
  CreateCampaignPayload,
} from "@/features/broadcast/repositories/campaign.repository";
import type { Campaign, CampaignReportDetail } from "@/features/broadcast/types/campaign";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { apiClient } from "@/services/api/client";
import type { CampaignDTO } from "@/types/broadcast";

class ApiCampaignRepository implements CampaignQueryRepository {
  async list(): Promise<Campaign[]> {
    return campaignService.list();
  }

  async getById(id: string): Promise<Campaign | undefined> {
    try {
      const response = await apiClient.get<CampaignDTO>(`/campaigns/${id}`);
      return parseCampaignDto(response.data!);
    } catch {
      return undefined;
    }
  }

  async create(input: CreateCampaignPayload): Promise<Campaign> {
    const response = await apiClient.post<CampaignDTO>("/campaigns", {
      name: input.name,
      channel_id: input.device_id,
      template_id: input.template_id,
      segment_ids: input.segment_ids ?? [],
      tag_ids: input.tag_ids ?? [],
      contact_ids: input.contact_ids ?? [],
      variable_mapping: { body: input.variable_mapping ?? {} },
      scheduled_at: input.scheduled_at,
    });
    return parseCampaignDto(response.data!);
  }

  async update(id: string, patch: Partial<Campaign>): Promise<Campaign> {
    const response = await apiClient.patch<CampaignDTO>(`/campaigns/${id}`, {
      name: patch.name,
      scheduled_at: patch.scheduled_at,
    });
    return parseCampaignDto(response.data!);
  }

  async cancel(id: string): Promise<Campaign> {
    return campaignService.cancel(id);
  }

  async getDashboardStats(): Promise<CampaignDashboardStats> {
    const overview = await campaignService.overview();
    return {
      stats: {
        total_campaigns: overview.total_campaigns,
        messages_sent: overview.total_sent,
        delivered_rate: overview.delivered_rate,
        read_rate: overview.read_rate,
        reply_rate: 0,
        changes: {
          campaigns: "0%",
          sent: "0%",
          delivered: "0%",
          read: "0%",
          replies: "0%",
        },
      },
      performanceTrend: [],
      channelBreakdown: [],
    };
  }

  async getCampaignReport(id: string): Promise<CampaignReportDetail | undefined> {
    try {
      const report = await campaignService.report(id);
      return {
        campaign: report,
        funnel: {
          sent: report.sent_count,
          delivered: report.delivered_count,
          read: report.read_count,
          clicked: report.clicked_count,
          replies: report.reply_count,
        },
        links: [],
        locations: [],
        devices: [],
      };
    } catch {
      return undefined;
    }
  }
}

export const campaignRepositoryApi = new ApiCampaignRepository();
