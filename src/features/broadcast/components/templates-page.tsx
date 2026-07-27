"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";

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
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { isWhatsAppChannel } from "@/features/channels/utils/is-whatsapp-channel";
import { formatApiErrorMessage } from "@/services/api/errors";
import type { WhatsAppTemplate } from "@/types/broadcast";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: connectedChannels = [] } = useQuery({
    queryKey: ["channels", "connected", "whatsapp"],
    queryFn: async () => {
      const list = await channelQueryService.getConnectedChannels();
      return list.filter(isWhatsAppChannel);
    },
  });

  const effectiveSyncChannelId = syncChannelId || connectedChannels[0]?.id || "";

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      language,
      category,
      status,
      page,
      page_size: PAGE_SIZE,
    }),
    [search, language, category, status, page],
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["broadcast-templates", queryParams],
    queryFn: () => templateService.listPage(queryParams),
  });

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, data?.pagination.total_pages ?? 1);
  const currentPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  async function handleSync() {
    if (!effectiveSyncChannelId) {
      setSyncError("Tidak ada channel WhatsApp terhubung. Hubungkan WABA terlebih dahulu.");
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

  async function handleDelete(template: WhatsAppTemplate) {
    if (!template.id) {
      setDeleteError("Template tidak memiliki id lokal.");
      return;
    }
    const confirmed = window.confirm(
      `Hapus template "${template.name}" (${template.language})?\nTemplate akan dihapus dari Meta dan dari aplikasi.`,
    );
    if (!confirmed) return;

    setDeletingId(template.id);
    setDeleteError(null);
    try {
      await templateService.delete(template.id);
      await refetch();
    } catch (err) {
      setDeleteError(formatApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template WhatsApp"
        description="Kelola message template Meta seperti di WhatsApp Manager — sync, buat, dan pantau status review."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/broadcast/templates/create">
                <Plus className="h-4 w-4" />
                Buat Template
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
              Sync Meta Templates
            </Button>
          </div>
        }
      />

      {syncError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {syncError}
        </div>
      ) : null}

      {deleteError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {deleteError}
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
              <DataTableHeaderCell className="w-[1%] text-right">Aksi</DataTableHeaderCell>
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
                  <DataTableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={!template.id || deletingId === template.id}
                      onClick={() => void handleDelete(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === template.id ? "Menghapus..." : "Hapus"}
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>

        <PaginationFooter
          start={start}
          end={end}
          total={total}
          totalLabel="templates"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {connectedChannels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Label>Tip:</Label> Hubungkan channel WhatsApp di halaman Devices untuk sync template dari Meta.
          Channel Instagram tidak mendukung message template.
        </p>
      ) : null}
    </div>
  );
}
