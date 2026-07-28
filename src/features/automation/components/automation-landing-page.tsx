"use client";

import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Button } from "@/components/ui/button";
import { AutomationNav } from "@/features/automation/components/automation-nav";
import { AutomationSummaryCards } from "@/features/automation/components/automation-summary-cards";
import { EndpointsTable } from "@/features/automation/components/endpoints/endpoints-table";
import { endpointService } from "@/features/automation/services/endpoint.service";
import type { ActionType } from "@/features/automation/types/action";
import type {
  AutomationEndpoint,
  AutomationSummary,
  EndpointStatus,
} from "@/features/automation/types/endpoint";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "send_template", label: "Send Template" },
  { value: "send_text", label: "Send Text" },
];

export function AutomationLandingPage({ showSummary = true }: { showSummary?: boolean }) {
  const { notify, Toast } = useToast();
  const [summary, setSummary] = useState<AutomationSummary | null>(null);
  const [endpoints, setEndpoints] = useState<AutomationEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResult, listResult] = await Promise.all([
        showSummary ? endpointService.getSummary() : Promise.resolve(null),
        endpointService.list({
          search,
          status: statusFilter as EndpointStatus | "all",
          actionType: actionFilter as ActionType | "all",
          page,
          pageSize,
        }),
      ]);
      if (summaryResult) setSummary(summaryResult);
      setEndpoints(listResult.items);
      setTotal(listResult.pagination.total);
      setTotalPages(listResult.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page, pageSize, search, showSummary, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, actionFilter, pageSize]);

  async function handleDisable(id: string) {
    await endpointService.disable(id);
    notify("success", "Endpoint disabled");
    void load();
  }

  async function handleEnable(id: string) {
    await endpointService.enable(id);
    notify("success", "Endpoint enabled");
    void load();
  }

  async function handleDuplicate(id: string) {
    const copy = await endpointService.duplicate(id);
    notify("success", `Duplicated as ${copy.name}`);
    void load();
  }

  async function handleDelete(id: string) {
    const target = endpoints.find((e) => e.id === id);
    if (!target) return;
    if (!window.confirm(`Delete endpoint "${target.name}"? This cannot be undone.`)) return;
    await endpointService.remove(id);
    notify("success", "Endpoint deleted");
    void load();
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <AutomationNav />
      <PageHeader
        title={showSummary ? "Automation" : "API Endpoints"}
        description={
          showSummary
            ? "Expose reusable HTTP APIs for WhatsApp, and forward inbound chats via Webhooks."
            : "Manage immutable automation endpoints your systems can call."
        }
        right={
          <Button asChild>
            <Link href="/automation/endpoints/new">
              <Plus className="h-4 w-4" />
              Create Endpoint
            </Link>
          </Button>
        }
      />

      {showSummary ? <AutomationSummaryCards summary={summary} loading={loading && !summary} /> : null}

      <div className="space-y-4 rounded-lg border bg-card">
        <div className="p-4 pb-0">
          <FilterBar>
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, slug, or endpoint id…"
                className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
              />
            </div>
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            <FilterSelect label="Action" value={actionFilter} onChange={setActionFilter} options={ACTION_OPTIONS} />
          </FilterBar>
        </div>

        {!loading && endpoints.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Expose your first WhatsApp template as an API</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Create an endpoint, map template variables, and let ERP, n8n, or billing systems call Omni Chan
                — no Meta API knowledge required.
              </p>
            </div>
            <Button asChild>
              <Link href="/automation/endpoints/new">
                <Plus className="h-4 w-4" />
                Create Endpoint
              </Link>
            </Button>
          </div>
        ) : (
          <EndpointsTable
            endpoints={endpoints}
            loading={loading}
            onDisable={(id) => void handleDisable(id)}
            onEnable={(id) => void handleEnable(id)}
            onDuplicate={(id) => void handleDuplicate(id)}
            onDelete={(id) => void handleDelete(id)}
          />
        )}

        {total > 0 ? (
          <PaginationFooter
            start={start}
            end={end}
            total={total}
            totalLabel="endpoints"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>

      <Toast />
    </div>
  );
}
