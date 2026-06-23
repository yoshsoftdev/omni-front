"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { DeliveryDonutChart } from "@/features/broadcast/components/delivery-donut-chart";
import { CampaignReportTable } from "@/features/broadcast/components/reports/campaign-report-table";
import { ReportChart } from "@/features/broadcast/components/reports/report-chart";
import { ReportStatsCard } from "@/features/broadcast/components/reports/report-stats-card";
import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import type { Campaign } from "@/features/broadcast/types/campaign";
import type { CampaignDashboardStats } from "@/features/broadcast/services/campaign-query.service";

const DATE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export function ReportsDashboardPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [dashboard, setDashboard] = useState<CampaignDashboardStats | null>(null);

  useEffect(() => {
    campaignQueryService.getCampaigns().then(setAllCampaigns);
    campaignQueryService.getDashboardStats().then(setDashboard);
  }, []);

  const campaigns = useMemo(() => {
    if (dateRange === "all") return allCampaigns;
    const days = dateRange === "30d" ? 30 : 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allCampaigns.filter((c) => new Date(c.created_at) >= cutoff);
  }, [allCampaigns, dateRange]);

  const channelData = (dashboard?.channelBreakdown ?? []).map((c) => ({
    label: c.channel === "whatsapp" ? "WhatsApp" : c.channel === "instagram" ? "Instagram" : "Other",
    value: c.count,
  }));

  if (!dashboard) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading reports...
      </div>
    );
  }

  const { stats, performanceTrend } = dashboard;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Campaign performance and delivery analytics." />

      <FilterBar>
        <FilterSelect label="Date Range" value={dateRange} onChange={setDateRange} options={DATE_OPTIONS} />
      </FilterBar>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ReportStatsCard title="Total Campaigns" value={stats.total_campaigns} change={stats.changes.campaigns} />
        <ReportStatsCard title="Messages Sent" value={stats.messages_sent} change={stats.changes.sent} />
        <ReportStatsCard title="Delivered" value={stats.delivered_rate} suffix="%" change={stats.changes.delivered} />
        <ReportStatsCard title="Read" value={stats.read_rate} suffix="%" change={stats.changes.read} />
        <ReportStatsCard title="Replies" value={stats.reply_rate} suffix="%" change={stats.changes.replies} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Performance Trend</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sent, Delivered, Read, and Replies over time</p>
          <div className="mt-4">
            <ReportChart data={performanceTrend} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Channel Breakdown</h2>
          <p className="mt-1 text-xs text-muted-foreground">Distribution by channel</p>
          <div className="mt-6">
            <DeliveryDonutChart data={channelData} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold">Campaign Reports</h2>
        <CampaignReportTable campaigns={campaigns} />
      </div>
    </div>
  );
}
