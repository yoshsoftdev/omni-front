"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, X } from "lucide-react";

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
import { PageTabs } from "@/components/shared/page-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import {
  campaignStatusLabels,
  matchesScheduleTab,
  scheduleTabs,
} from "@/features/broadcast/utils/campaign-status";

const PAGE_SIZE = 8;

function formatScheduleTime(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SchedulePage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["broadcast-campaigns"],
    queryFn: () => campaignService.list(),
  });

  const filtered = useMemo(
    () =>
      campaigns
        .filter((c) => c.scheduled_at || ["scheduled", "queued", "sending", "completed", "cancelled", "failed"].includes(c.status))
        .filter((c) => matchesScheduleTab(c.status, tab))
        .sort((a, b) => {
          const aTime = a.scheduled_at ?? a.created_at;
          const bTime = b.scheduled_at ?? b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }),
    [campaigns, tab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => campaignService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-campaigns"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Jadwal broadcast yang akan berjalan"
        right={
          <Button asChild>
            <Link href="/broadcast/campaign">
              <Plus className="h-4 w-4" />
              Buat Campaign
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 rounded-lg border bg-card">
        <div className="px-4 pt-2">
          <PageTabs
            tabs={scheduleTabs.map((t) => ({ value: t.value, label: t.label }))}
            value={tab}
            onChange={(value) => {
              setTab(value);
              setPage(1);
            }}
          />
        </div>

        <div className="px-4 pb-4">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Campaign</DataTableHeaderCell>
                <DataTableHeaderCell>WABA / Device</DataTableHeaderCell>
                <DataTableHeaderCell>Jadwal</DataTableHeaderCell>
                <DataTableHeaderCell>Target</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Aksi</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {isLoading ? (
                <DataTableEmpty message="Memuat jadwal campaign..." />
              ) : items.length === 0 ? (
                <DataTableEmpty message="Tidak ada campaign pada tab ini." />
              ) : (
                items.map((campaign) => (
                  <DataTableRow key={campaign.id}>
                    <DataTableCell>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {campaign.template_name ?? "—"}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="font-medium">{campaign.device_name ?? "—"}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {campaign.device_phone ?? "—"}
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {formatScheduleTime(campaign.scheduled_at ?? campaign.created_at)}
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {campaign.total_contacts.toLocaleString("id-ID")} kontak
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge status={campaignStatusLabels[campaign.status]} />
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <div className="relative inline-flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild title="View">
                          <Link href={`/broadcast/reports/${campaign.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {campaign.status === "scheduled" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Cancel"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(campaign.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={[
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm",
                    p === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
