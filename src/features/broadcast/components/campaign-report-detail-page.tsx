"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/broadcast/components/campaigns/campaign-table";
import { ReportFunnel } from "@/features/broadcast/components/reports/report-funnel";
import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import type { CampaignReportDetail } from "@/features/broadcast/types/campaign";
import { calcPct } from "@/features/broadcast/utils/campaign-metrics";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { DeliveryDonutChart } from "@/features/broadcast/components/delivery-donut-chart";

export function CampaignReportDetailPage({ campaignId }: { campaignId: string }) {
  const [tab, setTab] = useState("overview");
  const [detail, setDetail] = useState<CampaignReportDetail | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    campaignQueryService.getCampaignReport(campaignId).then((result) => {
      setDetail(result);
      setLoaded(true);
    });
  }, [campaignId]);

  if (!loaded) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading report...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/broadcast/reports"><ArrowLeft className="h-4 w-4" /> Back to Reports</Link>
        </Button>
        <div className="rounded-lg border bg-card p-8 text-sm text-destructive">Report not found.</div>
      </div>
    );
  }

  const { campaign, funnel, links, locations, devices } = detail;
  const funnelSteps = [
    { label: "Sent", value: funnel.sent, color: "#8B5CF6" },
    { label: "Delivered", value: funnel.delivered, color: "#0F9D8A" },
    { label: "Read", value: funnel.read, color: "#3B82F6" },
    { label: "Clicked", value: funnel.clicked, color: "#F59E0B" },
    { label: "Replies", value: funnel.replies, color: "#10B981" },
  ];

  const deviceData = devices.map((d) => ({
    label: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.count,
  }));

  const maxCity = Math.max(...locations.map((l) => l.count), 1);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/broadcast/reports"><ArrowLeft className="h-4 w-4" /> Back to Reports</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <StatusBadge status={campaign.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Sent {campaign.sent_count.toLocaleString()} · Delivered {calcPct(campaign.delivered_count, campaign.sent_count)}
        </p>
      </div>

      <PageTabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "recipients", label: "Recipients" },
          { value: "links", label: "Links" },
          { value: "locations", label: "Locations" },
          { value: "devices", label: "Devices" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Delivery Funnel</h2>
            <div className="mt-4">
              <ReportFunnel steps={funnelSteps} />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Link Performance</h2>
            <div className="mt-4">
              {links.length > 0 ? (
                <DataTable>
                  <DataTableHead>
                    <DataTableRow>
                      <DataTableHeaderCell>Link</DataTableHeaderCell>
                      <DataTableHeaderCell>Clicks</DataTableHeaderCell>
                      <DataTableHeaderCell>Unique</DataTableHeaderCell>
                      <DataTableHeaderCell>CTR</DataTableHeaderCell>
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {links.map((link) => (
                      <DataTableRow key={link.id}>
                        <DataTableCell className="max-w-[200px] truncate text-xs">{link.url}</DataTableCell>
                        <DataTableCell>{link.clicks}</DataTableCell>
                        <DataTableCell>{link.unique_clicks}</DataTableCell>
                        <DataTableCell>{link.ctr.toFixed(1)}%</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              ) : (
                <p className="text-sm text-muted-foreground">No link data available.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "recipients" ? (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Segment: <strong>{campaign.segment_name}</strong> · {campaign.total_contacts.toLocaleString()} recipients
          </p>
        </div>
      ) : null}

      {tab === "links" ? (
        <div className="rounded-lg border bg-card p-4">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Link</DataTableHeaderCell>
                <DataTableHeaderCell>Clicks</DataTableHeaderCell>
                <DataTableHeaderCell>Unique Clicks</DataTableHeaderCell>
                <DataTableHeaderCell>CTR</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {links.length === 0 ? (
                <DataTableEmpty message="No links tracked." />
              ) : (
                links.map((link) => (
                  <DataTableRow key={link.id}>
                    <DataTableCell>{link.url}</DataTableCell>
                    <DataTableCell>{link.clicks}</DataTableCell>
                    <DataTableCell>{link.unique_clicks}</DataTableCell>
                    <DataTableCell>{link.ctr.toFixed(1)}%</DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </div>
      ) : null}

      {tab === "locations" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Top Cities</h2>
            <div className="mt-4 space-y-3">
              {locations.map((loc) => (
                <div key={loc.city}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{loc.city}</span>
                    <span className="text-muted-foreground">{loc.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(loc.count / maxCity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Top Regions</h2>
            <div className="mt-4 space-y-2 text-sm">
              {locations.map((loc) => (
                <div key={loc.region} className="flex justify-between border-b py-2 last:border-0">
                  <span>{loc.region}</span>
                  <span className="text-muted-foreground">{loc.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "devices" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Device Breakdown</h2>
            <div className="mt-6">
              <DeliveryDonutChart data={deviceData} />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Devices</h2>
            <div className="mt-4 space-y-3">
              {devices.map((d) => (
                <div key={d.device} className="flex justify-between text-sm">
                  <span className="capitalize">{d.device}</span>
                  <span className="text-muted-foreground">{d.percentage}% ({d.count.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
