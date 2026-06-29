"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

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
import { ColorDot } from "@/components/shared/color-dot";
import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/broadcast/components/campaigns/campaign-table";
import { formatSchedule } from "@/features/broadcast/utils/campaign-list-format";
import { ScheduleCalendar, ScheduleMiniCalendar } from "@/features/broadcast/components/schedules/schedule-calendar";
import { ScheduleDrawer } from "@/features/broadcast/components/schedules/schedule-drawer";
import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import type { Campaign } from "@/features/broadcast/types/campaign";
import { useToast } from "@/hooks/use-toast";

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function SchedulesPage() {
  const { notify, Toast } = useToast();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 20));

  useEffect(() => {
    campaignQueryService.getScheduledCampaigns().then(setCampaigns);
  }, []);

  const dayCampaigns = useMemo(
    () => campaigns.filter((c) => c.scheduled_at && sameDay(new Date(c.scheduled_at), selectedDate)),
    [campaigns, selectedDate],
  );

  function openDrawer(campaign: Campaign) {
    setSelected(campaign);
    setDrawerOpen(true);
  }

  function handleCancel() {
    if (!selected) return;
    setCampaigns((prev) => prev.map((c) => (c.id === selected.id ? { ...c, status: "cancelled" } : c)));
    setSelected((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    notify("success", "Schedule cancelled");
  }

  function handleDuplicate() {
    if (!selected) return;
    const copy = { ...selected, id: `cmp_${Date.now()}`, name: `${selected.name} (Copy)`, status: "draft" as const };
    setCampaigns((prev) => [copy, ...prev]);
    notify("success", "Schedule duplicated");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedules"
        description="View and manage scheduled broadcast campaigns."
        right={
          <Button asChild>
            <Link href="/broadcast/campaigns/create"><Plus className="h-4 w-4" /> Create Campaign</Link>
          </Button>
        }
      />

      <PageTabs
        tabs={[
          { value: "list", label: "List View" },
          { value: "calendar", label: "Calendar View" },
        ]}
        value={view}
        onChange={(v) => setView(v as "list" | "calendar")}
      />

      {view === "list" ? (
        <div className="rounded-lg border bg-card p-4">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Campaign</DataTableHeaderCell>
                <DataTableHeaderCell>Audience</DataTableHeaderCell>
                <DataTableHeaderCell>Schedule Time</DataTableHeaderCell>
                <DataTableHeaderCell>Recipients</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {campaigns.length === 0 ? (
                <DataTableEmpty message="No scheduled campaigns." />
              ) : (
                campaigns.map((campaign) => (
                  <DataTableRow key={campaign.id}>
                    <DataTableCell className="font-medium">{campaign.name}</DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        <ColorDot color="#10B981" className="h-2 w-2" />
                        {campaign.segment_name}
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">{formatSchedule(campaign.scheduled_at)}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{campaign.total_contacts.toLocaleString()}</DataTableCell>
                    <DataTableCell><StatusBadge status={campaign.status} /></DataTableCell>
                    <DataTableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openDrawer(campaign)}>View</Button>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <ScheduleMiniCalendar campaigns={campaigns} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="space-y-4">
            <ScheduleCalendar campaigns={campaigns} onSelectCampaign={openDrawer} />
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">
                Scheduled for {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              {dayCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaigns scheduled for this date.</p>
              ) : (
                <div className="space-y-2">
                  {dayCampaigns.map((c) => (
                    <button key={c.id} type="button" onClick={() => openDrawer(c)} className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40">
                      <span>{c.name}</span>
                      <StatusBadge status={c.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ScheduleDrawer
        campaign={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => notify("success", "Edit schedule (mock)")}
        onDuplicate={handleDuplicate}
        onCancel={handleCancel}
      />

      <Toast />
    </div>
  );
}
