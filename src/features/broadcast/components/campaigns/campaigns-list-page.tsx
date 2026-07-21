"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { CampaignTable } from "@/features/broadcast/components/campaigns/campaign-table";
import { useCampaignSendGuard } from "@/features/broadcast/hooks/use-campaign-send-guard";
import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { Campaign, CampaignStatus } from "@/features/broadcast/types/campaign";
import type { Template } from "@/features/broadcast/types/template";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

export function CampaignsListPage() {
  const { notify, Toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    campaignQueryService.getCampaigns().then(setCampaigns);
  }, []);

  useEffect(() => {
    templateQueryService.getTemplates().then(setTemplates);
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (templateFilter !== "all" && c.template_id !== templateFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.template_name.toLowerCase().includes(q)) return false;
      }
      if (dateFrom && c.created_at.slice(0, 10) < dateFrom) return false;
      if (dateTo && c.created_at.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [campaigns, statusFilter, templateFilter, search, dateFrom, dateTo]);

  function handleCancel(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "cancelled" as CampaignStatus } : c)),
    );
    notify("success", "Campaign cancelled");
  }

  function handleDuplicate(id: string) {
    const source = campaigns.find((c) => c.id === id);
    if (!source) return;
    const copy: Campaign = {
      ...source,
      id: `cmp_${Date.now()}`,
      name: `${source.name} (Copy)`,
      status: "draft",
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
      reply_count: 0,
      clicked_count: 0,
      created_at: new Date().toISOString(),
    };
    setCampaigns((prev) => [copy, ...prev]);
    notify("success", "Campaign duplicated");
  }

  const { sendCampaign, paymentDialog } = useCampaignSendGuard();

  function handleSend(campaign: Campaign) {
    void sendCampaign(campaign.id, campaign.device_id)
      .then((updated) => {
        setCampaigns((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        notify("success", "Campaign queued for send");
      })
      .catch((error) => {
        if (formatApiErrorMessage(error) !== "Marketing campaigns require a Meta payment method.") {
          notify("error", formatApiErrorMessage(error));
        }
      });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Create and manage WhatsApp broadcast campaigns."
        right={
          <Button asChild>
            <Link href="/broadcast/campaigns/create">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <FilterBar>
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
            />
          </div>
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          <FilterSelect
            label="Template"
            value={templateFilter}
            onChange={setTemplateFilter}
            options={[{ value: "all", label: "All Templates" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]}
          />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 rounded-md border px-2 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 rounded-md border px-2 text-sm" />
        </FilterBar>

        <CampaignTable
          campaigns={filtered}
          onCancel={handleCancel}
          onDuplicate={handleDuplicate}
          onSend={handleSend}
        />
      </div>

      {paymentDialog}
      <Toast />
    </div>
  );
}
