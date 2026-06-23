import {
  MOCK_CAMPAIGNS,
  MOCK_CHANNEL_BREAKDOWN,
  MOCK_PERFORMANCE_TREND,
  MOCK_REPORT_DETAILS,
  MOCK_REPORT_STATS,
} from "@/features/broadcast/mock/campaign-mock-data";
import type {
  CampaignQueryRepository,
  CampaignDashboardStats,
  CreateCampaignPayload,
} from "@/features/broadcast/repositories/campaign.repository";
import type { Campaign, CampaignReportDetail } from "@/features/broadcast/types/campaign";

/**
 * Mock campaign repository — sole consumer of campaign-mock-data.ts.
 * Campaigns are native domain objects; boundary/mapper are not used here.
 * Future campaign.repository.api.ts will use campaign.boundary.ts for DTO conversion.
 */
class MockCampaignRepository implements CampaignQueryRepository {
  private campaigns: Campaign[] = MOCK_CAMPAIGNS.map((campaign) => ({ ...campaign }));

  async list(): Promise<Campaign[]> {
    return this.campaigns.map((campaign) => ({ ...campaign }));
  }

  async getById(id: string): Promise<Campaign | undefined> {
    const campaign = this.campaigns.find((item) => item.id === id);
    return campaign ? { ...campaign } : undefined;
  }

  async create(input: CreateCampaignPayload): Promise<Campaign> {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      ...input,
      id: `cmp_${Date.now()}`,
      created_at: input.created_at ?? now,
      updated_at: now,
    };
    this.campaigns = [campaign, ...this.campaigns];
    return { ...campaign };
  }

  async update(id: string, patch: Partial<Campaign>): Promise<Campaign> {
    const index = this.campaigns.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Campaign not found: ${id}`);
    }
    const updated: Campaign = {
      ...this.campaigns[index],
      ...patch,
      id,
      updated_at: new Date().toISOString(),
    };
    this.campaigns[index] = updated;
    return { ...updated };
  }

  async cancel(id: string): Promise<Campaign> {
    return this.update(id, { status: "cancelled" });
  }

  async getDashboardStats(): Promise<CampaignDashboardStats> {
    return {
      stats: MOCK_REPORT_STATS,
      performanceTrend: MOCK_PERFORMANCE_TREND,
      channelBreakdown: MOCK_CHANNEL_BREAKDOWN,
    };
  }

  async getCampaignReport(id: string): Promise<CampaignReportDetail | undefined> {
    if (MOCK_REPORT_DETAILS[id]) {
      const detail = MOCK_REPORT_DETAILS[id];
      const campaign = await this.getById(id);
      if (!campaign) return undefined;
      return {
        ...detail,
        campaign,
      };
    }

    const campaign = await this.getById(id);
    if (!campaign) return undefined;

    return {
      campaign,
      funnel: {
        sent: campaign.sent_count,
        delivered: campaign.delivered_count,
        read: campaign.read_count,
        clicked: campaign.clicked_count,
        replies: campaign.reply_count,
      },
      links: [],
      locations: [
        { city: "Jakarta", region: "DKI Jakarta", count: Math.round(campaign.delivered_count * 0.4) },
        { city: "Bandung", region: "Jawa Barat", count: Math.round(campaign.delivered_count * 0.2) },
      ],
      devices: [
        { device: "mobile", count: Math.round(campaign.delivered_count * 0.85), percentage: 85 },
        { device: "desktop", count: Math.round(campaign.delivered_count * 0.1), percentage: 10 },
        { device: "other", count: Math.round(campaign.delivered_count * 0.05), percentage: 5 },
      ],
    };
  }
}

export const campaignRepositoryMock = new MockCampaignRepository();
