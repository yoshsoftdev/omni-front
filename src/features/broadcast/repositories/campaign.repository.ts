import { campaignRepositoryApi } from "@/features/broadcast/repositories/campaign.repository.api";
import type {
  Campaign,
  CampaignReportDetail,
  ChannelBreakdown,
  PerformanceTrendPoint,
  ReportDashboardStats,
} from "@/features/broadcast/types/campaign";

export type CampaignDashboardStats = {
  stats: ReportDashboardStats;
  performanceTrend: PerformanceTrendPoint[];
  channelBreakdown: ChannelBreakdown[];
};

export type CreateCampaignPayload = Omit<Campaign, "id">;

export interface CampaignRepository {
  list(): Promise<Campaign[]>;
  getById(id: string): Promise<Campaign | undefined>;
  create(input: CreateCampaignPayload): Promise<Campaign>;
  update(id: string, patch: Partial<Campaign>): Promise<Campaign>;
  cancel(id: string): Promise<Campaign>;
}

/** Read operations used by campaignQueryService until API repository lands. */
export interface CampaignQueryRepository extends CampaignRepository {
  getDashboardStats(): Promise<CampaignDashboardStats>;
  getCampaignReport(id: string): Promise<CampaignReportDetail | undefined>;
}

export function getCampaignRepository(): CampaignQueryRepository {
  return campaignRepositoryApi;
}
