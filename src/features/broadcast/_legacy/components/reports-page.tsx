"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/features/broadcast/components/campaigns/campaign-table";
import { PerformanceLineChart } from "@/features/broadcast/components/performance-line-chart";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import type { Campaign } from "@/features/broadcast/types/campaign";
import type { PerformanceDataPoint } from "@/features/broadcast/mock/mock-data";

const reportDateRangeOptions = [
  { value: "7d", label: "7 hari terakhir" },
  { value: "30d", label: "30 hari terakhir" },
  { value: "all", label: "Semua waktu" },
];

function filterByDateRange(campaigns: Campaign[], range: string): Campaign[] {
  if (range === "all") return campaigns;
  const days = range === "30d" ? 30 : 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return campaigns.filter((c) => c.created_at && new Date(c.created_at) >= cutoff);
}

function buildTimeline(campaigns: Campaign[]): PerformanceDataPoint[] {
  const days = 7;
  const points: PerformanceDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayCampaigns = campaigns.filter((c) => c.created_at?.slice(0, 10) === key);
    points.push({
      date: key,
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      sent: dayCampaigns.reduce((sum, c) => sum + c.sent_count, 0),
      read: dayCampaigns.reduce((sum, c) => sum + c.read_count, 0),
      failed: dayCampaigns.reduce((sum, c) => sum + c.failed_count, 0),
    });
  }
  return points;
}

export function ReportsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [deviceId, setDeviceId] = useState("all");

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["broadcast-reports-overview"],
    queryFn: () => campaignService.overview(),
  });

  const { data: allCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["broadcast-campaigns"],
    queryFn: () => campaignService.list(),
  });

  const deviceOptions = useMemo(() => {
    const devices = new Map<string, string>();
    allCampaigns.forEach((c) => {
      if (c.device_id && c.device_name) {
        devices.set(c.device_id, c.device_name);
      }
    });
    return [
      { value: "all", label: "Semua WABA" },
      ...Array.from(devices.entries()).map(([id, name]) => ({ value: id, label: name })),
    ];
  }, [allCampaigns]);

  const campaigns = useMemo(() => {
    let items = filterByDateRange(allCampaigns, dateRange);
    if (deviceId !== "all") {
      items = items.filter((c) => c.device_id === deviceId);
    }
    return items.sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    );
  }, [allCampaigns, dateRange, deviceId]);

  const timeline = useMemo(() => buildTimeline(campaigns), [campaigns]);
  const isLoading = overviewLoading || campaignsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Ringkasan performa campaign broadcast"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar>
          <FilterSelect
            label="Rentang tanggal"
            value={dateRange}
            onChange={setDateRange}
            options={reportDateRangeOptions}
          />
          <FilterSelect
            label="WABA"
            value={deviceId}
            onChange={setDeviceId}
            options={deviceOptions}
          />
        </FilterBar>
      </div>

      {isLoading || !overview ? (
        <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          Memuat laporan...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard title="Total Campaign" value={overview.total_campaigns} />
            <StatsCard title="Total Terkirim" value={overview.total_sent.toLocaleString("id-ID")} />
            <StatsCard
              title="Terkirim"
              value={overview.delivered_rate.toFixed(1)}
              suffix="%"
            />
            <StatsCard
              title="Terbaca"
              value={overview.read_rate.toFixed(1)}
              suffix="%"
            />
            <StatsCard
              title="Gagal"
              value={overview.failed_rate.toFixed(1)}
              suffix="%"
            />
          </div>

          <div className="rounded-lg border bg-card p-4 md:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Performa Pengiriman</h2>
              <p className="text-xs text-muted-foreground">
                Tren terkirim, terbaca, dan gagal dalam 7 hari terakhir
              </p>
            </div>
            <PerformanceLineChart data={timeline} />
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Campaign Terbaru</h2>
            </div>

            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>Campaign</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <DataTableHeaderCell>Terkirim</DataTableHeaderCell>
                  <DataTableHeaderCell>Terbaca</DataTableHeaderCell>
                  <DataTableHeaderCell>Gagal</DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">Aksi</DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {campaigns.length === 0 ? (
                  <DataTableEmpty message="Belum ada data campaign." />
                ) : (
                  campaigns.slice(0, 20).map((campaign) => (
                    <DataTableRow key={campaign.id}>
                      <DataTableCell className="font-medium">{campaign.name}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge status={campaign.status} />
                      </DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {campaign.sent_count.toLocaleString("id-ID")}
                      </DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {campaign.read_count.toLocaleString("id-ID")}
                      </DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {campaign.failed_count.toLocaleString("id-ID")}
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <Link
                          href={`/broadcast/reports/${campaign.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          title="Lihat detail"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
