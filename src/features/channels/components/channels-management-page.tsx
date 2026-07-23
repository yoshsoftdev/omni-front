"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/shared/provider-badge";
import { AddChannelModal } from "@/features/channels/components/add-channel-modal";
import { ChannelConnectionBadge } from "@/features/channels/components/detail/channel-detail-primitives";
import { PaymentStatusBadge } from "@/features/channels/components/detail/channel-payment-card";
import { InstagramChannelDetail } from "@/features/channels/components/detail/instagram-channel-detail";
import { MessengerChannelDetail } from "@/features/channels/components/detail/messenger-channel-detail";
import { WhatsAppChannelDetail } from "@/features/channels/components/detail/whatsapp-channel-detail";
import { channelCommandService } from "@/features/channels/services/channel-command.service";
import { channelHealthService } from "@/features/channels/services/channel-health.service";
import {
  channelPaymentService,
  type ChannelPaymentStatus,
  type ChannelPaymentStatusResult,
} from "@/features/channels/services/channel-payment.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { channelSyncService } from "@/features/channels/services/channel-sync.service";
import type { Channel } from "@/features/channels/types/channel";
import {
  FILTER_OPTIONS,
  GROUP_LABELS,
  formatSecondaryIdentifier,
  getChannelKind,
  providerIconTone,
  type ChannelKind,
  type ProviderFilter,
} from "@/features/channels/utils/channel-display";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

function ProviderFilterPills({
  value,
  onChange,
}: {
  value: ProviderFilter;
  onChange: (value: ProviderFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:bg-muted",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ChannelsManagementPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [showSyncSection, setShowSyncSection] = useState(false);

  const loadChannels = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await channelQueryService.getChannels();
      setChannels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const filtered = useMemo(() => {
    if (providerFilter === "all") return channels.slice();
    return channels.filter((c) => getChannelKind(c) === providerFilter);
  }, [channels, providerFilter]);

  const grouped = useMemo(() => {
    const out: Record<ChannelKind, Channel[]> = {
      whatsapp: [],
      instagram: [],
      messenger: [],
    };
    for (const ch of filtered) {
      out[getChannelKind(ch)].push(ch);
    }
    (Object.keys(out) as ChannelKind[]).forEach((key) => {
      out[key].sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""));
    });
    return out;
  }, [filtered]);

  const whatsappChannels = useMemo(
    () => channels.filter((c) => getChannelKind(c) === "whatsapp"),
    [channels],
  );

  useEffect(() => {
    if (!selectedChannelId && filtered.length > 0) {
      setSelectedChannelId(filtered[0].id);
    }
  }, [filtered, selectedChannelId]);

  const selectedChannel = useMemo(() => {
    if (!selectedChannelId) return undefined;
    return channels.find((c) => c.id === selectedChannelId);
  }, [channels, selectedChannelId]);

  const [payment, setPayment] = useState<ChannelPaymentStatusResult | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentOpening, setPaymentOpening] = useState(false);
  const [paymentByChannelId, setPaymentByChannelId] = useState<
    Record<string, ChannelPaymentStatus | "loading">
  >({});
  const [syncStatus, setSyncStatus] = useState<Awaited<
    ReturnType<typeof channelSyncService.getStatus>
  > | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof channelHealthService.check>> | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

  const refreshPaymentStatus = useCallback(async (channelId: string) => {
    setPaymentLoading(true);
    setPaymentByChannelId((prev) => ({ ...prev, [channelId]: "loading" }));
    try {
      const result = await channelPaymentService.getStatus(channelId);
      setPayment(result);
      setPaymentByChannelId((prev) => ({ ...prev, [channelId]: result.status }));
      return result;
    } catch {
      const fallback: ChannelPaymentStatusResult = {
        status: "missing",
        message: "Metode pembayaran belum dikonfigurasi.",
        has_primary_funding: false,
      };
      setPayment(fallback);
      setPaymentByChannelId((prev) => ({ ...prev, [channelId]: "missing" }));
      return fallback;
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (channel: Channel) => {
      setShowSyncSection(false);
      setPayment(null);
      setSyncStatus(null);
      setHealth(null);
      setDetailLoading(true);

      const kind = getChannelKind(channel);
      if (kind === "whatsapp") {
        await refreshPaymentStatus(channel.id);
      }

      try {
        const s = await channelSyncService.getStatus(channel.id);
        setSyncStatus(s);
      } catch {
        // best-effort
      }

      try {
        const h = await channelHealthService.check(channel.id);
        setHealth(h);
      } catch {
        // best-effort
      } finally {
        setDetailLoading(false);
      }
    },
    [refreshPaymentStatus],
  );

  useEffect(() => {
    if (!selectedChannel) return;
    void loadDetail(selectedChannel);
  }, [selectedChannel, loadDetail]);

  useEffect(() => {
    const waChannels = channels.filter((c) => getChannelKind(c) === "whatsapp");
    if (waChannels.length === 0) return;

    let cancelled = false;
    waChannels.forEach((ch) => {
      setPaymentByChannelId((prev) => {
        if (prev[ch.id]) return prev;
        return { ...prev, [ch.id]: "loading" };
      });
      void channelPaymentService
        .getStatus(ch.id)
        .then((result) => {
          if (cancelled) return;
          setPaymentByChannelId((prev) => ({ ...prev, [ch.id]: result.status }));
        })
        .catch(() => {
          if (cancelled) return;
          setPaymentByChannelId((prev) => ({ ...prev, [ch.id]: "missing" }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [channels]);

  useEffect(() => {
    function onFocus() {
      if (!selectedChannel || getChannelKind(selectedChannel) !== "whatsapp") return;
      if (payment?.status === "configured") return;
      void refreshPaymentStatus(selectedChannel.id);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [selectedChannel, payment?.status, refreshPaymentStatus]);

  const selectedKind = selectedChannel ? getChannelKind(selectedChannel) : undefined;

  async function handleOpenPayment() {
    if (!selectedChannel || selectedKind !== "whatsapp") return;
    setPaymentOpening(true);
    try {
      const url = await channelPaymentService.createPaymentLink(selectedChannel.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setPaymentOpening(false);
    }
  }

  function handleOpenMeta() {
    if (!selectedChannel || selectedKind !== "whatsapp") return;
    const wabaId = selectedChannel.waba_id?.trim();
    if (wabaId) {
      window.open(
        `https://business.facebook.com/wa/manage/home/?waba_id=${encodeURIComponent(wabaId)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    window.open("https://business.facebook.com/", "_blank", "noopener,noreferrer");
  }

  async function handleDeleteChannel() {
    if (!selectedChannel || !canManage) return;
    if (!confirm(`Delete channel "${selectedChannel.label}"?`)) return;
    await channelCommandService.deleteChannel(selectedChannel.id);
    setSelectedChannelId(null);
    await loadChannels();
  }

  const listKinds: ChannelKind[] =
    providerFilter === "all" ? ["whatsapp", "instagram", "messenger"] : [providerFilter];

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading channels...</p>;
  }

  if (error) {
    return <p className="p-6 text-sm text-destructive">{error}</p>;
  }

  if (channels.length === 0) {
    return (
      <>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-dashed p-10 text-center">
            <h1 className="text-2xl font-semibold">Channels</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage all communication channels connected to your workspace.
            </p>
            <div className="mt-6 flex justify-center">
              <Button type="button" disabled={!canManage} onClick={() => setConnectOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Connect Channel
              </Button>
            </div>
          </div>
        </div>
        <AddChannelModal
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          onConnected={() => {
            setConnectOpen(false);
            void loadChannels();
          }}
          canManage={canManage}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background lg:flex-row">
      <aside className="w-full shrink-0 border-b border-border bg-card lg:w-[320px] lg:border-b-0 lg:border-r">
        <div className="space-y-4 p-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Channels</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage all communication channels connected to your workspace.
            </p>
          </div>

          <Button type="button" className="w-full" onClick={() => setConnectOpen(true)} disabled={!canManage}>
            <Plus className="mr-1.5 h-4 w-4" />
            Connect Channel
          </Button>

          <ProviderFilterPills value={providerFilter} onChange={setProviderFilter} />

          <div className="space-y-4">
            {listKinds.map((kind) => {
              const list = grouped[kind];
              if (list.length === 0) return null;
              const tone = providerIconTone(kind);
              return (
                <div key={kind} className="space-y-1">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {GROUP_LABELS[kind]} ({list.length})
                  </p>
                  <div className="space-y-1">
                    {list.map((ch) => {
                      const selected = ch.id === selectedChannelId;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSelectedChannelId(ch.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2.5 text-left transition",
                            selected
                              ? "border-primary bg-muted"
                              : "border-transparent hover:bg-muted/60",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              tone.wrap,
                            )}
                          >
                            <ProviderIcon provider={kind} className={cn("h-4 w-4", tone.icon)} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{ch.label}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {formatSecondaryIdentifier(ch, kind)}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <ChannelConnectionBadge status={ch.status} />
                            {kind === "whatsapp" ? (
                              <PaymentStatusBadge status={paymentByChannelId[ch.id] ?? null} />
                            ) : null}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {selectedChannel && selectedKind === "whatsapp" ? (
        <WhatsAppChannelDetail
          channel={selectedChannel}
          canManage={canManage}
          detailLoading={detailLoading}
          payment={payment}
          paymentLoading={paymentLoading}
          paymentOpening={paymentOpening}
          health={health}
          lastSyncAt={syncStatus?.last_sync_at}
          showSyncSection={showSyncSection}
          onShowSync={() => setShowSyncSection(true)}
          onRefresh={() => void loadDetail(selectedChannel)}
          onRefreshPayment={() => void refreshPaymentStatus(selectedChannel.id)}
          onOpenPayment={() => void handleOpenPayment()}
          onOpenMeta={handleOpenMeta}
          onDelete={() => void handleDeleteChannel()}
        />
      ) : null}

      {selectedChannel && selectedKind === "instagram" ? (
        <InstagramChannelDetail
          channel={selectedChannel}
          whatsappChannels={whatsappChannels}
          canManage={canManage}
          detailLoading={detailLoading}
          lastSyncAt={syncStatus?.last_sync_at}
          showSyncSection={showSyncSection}
          onShowSync={() => setShowSyncSection(true)}
          onRefresh={() => void loadDetail(selectedChannel)}
          onDelete={() => void handleDeleteChannel()}
        />
      ) : null}

      {selectedChannel && selectedKind === "messenger" ? (
        <MessengerChannelDetail
          channel={selectedChannel}
          canManage={canManage}
          detailLoading={detailLoading}
          lastSyncAt={syncStatus?.last_sync_at}
          showSyncSection={showSyncSection}
          onShowSync={() => setShowSyncSection(true)}
          onRefresh={() => void loadDetail(selectedChannel)}
          onDelete={() => void handleDeleteChannel()}
        />
      ) : null}

      {!selectedChannel ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Select a channel to view details.</p>
        </div>
      ) : null}

      <AddChannelModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={() => {
          setConnectOpen(false);
          void loadChannels();
        }}
        canManage={canManage}
      />
    </div>
  );
}
