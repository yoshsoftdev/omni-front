"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, Search } from "lucide-react";

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
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";

const PAGE_SIZE = 8;

const templateLanguageOptions = [
  { value: "all", label: "Semua Bahasa" },
  { value: "id", label: "Indonesia" },
  { value: "en", label: "English" },
];

const templateCategoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

const templateStatusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

function formatLastSync(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncChannelId, setSyncChannelId] = useState("");

  const { data: connectedChannels = [] } = useQuery({
    queryKey: ["channels", "connected"],
    queryFn: () => channelQueryService.getConnectedChannels(),
  });

  const effectiveSyncChannelId = syncChannelId || connectedChannels[0]?.id || "";

  const filters = useMemo(
    () => ({ search, language, category, status }),
    [search, language, category, status],
  );

  const { data: allTemplates = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["broadcast-templates", filters],
    queryFn: () => templateService.list(filters),
  });

  const totalPages = Math.max(1, Math.ceil(allTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = allTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleSync() {
    if (!effectiveSyncChannelId) {
      setSyncError("Tidak ada channel terhubung. Hubungkan WABA terlebih dahulu.");
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      await templateService.sync(effectiveSyncChannelId);
      await refetch();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Gagal sync template");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Kelola template WhatsApp (Meta) Anda"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/broadcast/templates/create">
                <Plus className="h-4 w-4" />
                Create Template
              </Link>
            </Button>
            {connectedChannels.length > 1 ? (
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={effectiveSyncChannelId}
                onChange={(e) => setSyncChannelId(e.target.value)}
              >
                {connectedChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.label}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleSync}
              disabled={syncing || isFetching || !effectiveSyncChannelId}
            >
              <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Sync Template
            </Button>
          </div>
        }
      />

      {syncError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {syncError}
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari template..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <FilterBar>
            <FilterSelect
              label="Bahasa"
              value={language}
              onChange={(v) => {
                setLanguage(v);
                setPage(1);
              }}
              options={templateLanguageOptions}
            />
            <FilterSelect
              label="Kategori"
              value={category}
              onChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
              options={templateCategoryOptions}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={templateStatusOptions}
            />
          </FilterBar>
        </div>

        <DataTable>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Template</DataTableHeaderCell>
              <DataTableHeaderCell>Bahasa</DataTableHeaderCell>
              <DataTableHeaderCell>Kategori</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Terakhir Sync</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {isLoading ? (
              <DataTableEmpty message="Memuat template..." />
            ) : items.length === 0 ? (
              <DataTableEmpty message="Tidak ada template ditemukan. Sync dari Meta untuk memuat template." />
            ) : (
              items.map((template) => (
                <DataTableRow
                  key={
                    template.id ||
                    `${template.meta_template_id ?? template.name}-${template.language}`
                  }
                >
                  <DataTableCell>
                    <div className="font-medium">{template.name}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {template.preview ?? "—"}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{template.language}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{template.category ?? "—"}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge status={template.status ?? "—"} />
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">
                    {formatLastSync(template.updated_at)}
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>

        {totalPages > 1 ? (
          <div className="flex items-center justify-end gap-1 pt-2">
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

      {connectedChannels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Label>Tip:</Label> Hubungkan channel WhatsApp di halaman Devices untuk dapat sync template dari Meta.
        </p>
      ) : null}
    </div>
  );
}
