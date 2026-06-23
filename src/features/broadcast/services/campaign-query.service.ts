import {
  getCampaignRepository,
  type CampaignDashboardStats,
} from "@/features/broadcast/repositories/campaign.repository";
import type { Campaign, CampaignReportDetail } from "@/features/broadcast/types/campaign";

const repository = getCampaignRepository();

export type { CampaignDashboardStats };

/**
 * Campaign read façade for UI pages.
 * Delegates to CampaignRepository — never imports mock data directly.
 */
export const campaignQueryService = {
  async getCampaigns(): Promise<Campaign[]> {
    return repository.list();
  },

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    return repository.getById(id);
  },

  async getScheduledCampaigns(): Promise<Campaign[]> {
    const campaigns = await repository.list();
    return campaigns.filter(
      (campaign) =>
        campaign.status === "scheduled" ||
        campaign.status === "running" ||
        Boolean(campaign.scheduled_at),
    );
  },

  async getDashboardStats(): Promise<CampaignDashboardStats> {
    return repository.getDashboardStats();
  },

  async getCampaignReport(id: string): Promise<CampaignReportDetail | undefined> {
    return repository.getCampaignReport(id);
  },
};
