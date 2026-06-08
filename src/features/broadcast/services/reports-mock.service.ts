import {
  mockCampaignReportDetails,
  mockCampaignReports,
  mockPerformanceTimeline,
  mockReportKPI,
  type CampaignReportDetail,
  type CampaignReportRow,
  type PerformanceDataPoint,
  type ReportKPI,
} from "@/features/broadcast/mock/mock-data";

export type ReportFilters = {
  dateRange?: string;
  wabaId?: string;
};

export type ReportOverview = {
  kpi: ReportKPI;
  timeline: PerformanceDataPoint[];
  campaigns: CampaignReportRow[];
};

export async function fetchReportOverview(filters: ReportFilters = {}): Promise<ReportOverview> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  void filters;

  return {
    kpi: mockReportKPI,
    timeline: mockPerformanceTimeline,
    campaigns: mockCampaignReports,
  };
}

export async function fetchCampaignReportDetail(id: string): Promise<CampaignReportDetail> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = mockCampaignReportDetails[id];
  if (!detail) {
    throw new Error("Campaign report not found");
  }
  return detail;
}
