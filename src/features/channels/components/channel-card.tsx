"use client";

import { useEffect, useState } from "react";

import { ChannelStatusBadge } from "@/features/channels/components/channel-status-badge";
import { ChannelSyncSection } from "@/features/channels/components/channel-sync-section";
import { channelCommandService } from "@/features/channels/services/channel-command.service";
import { channelHealthService } from "@/features/channels/services/channel-health.service";
import { channelPaymentService } from "@/features/channels/services/channel-payment.service";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import type { Channel } from "@/features/channels/types/channel";
import { useAuthStore } from "@/store/auth-store";

interface ChannelCardProps {
  channel: Channel;
  onChanged: () => void;
}

export function ChannelCard({ channel, onChanged }: ChannelCardProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"configured" | "missing" | "loading">("loading");
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPaymentStatus("loading");
    channelPaymentService
      .getStatus(channel.id)
      .then((result) => {
        if (!cancelled) setPaymentStatus(result.status === "configured" ? "configured" : "missing");
      })
      .catch(() => {
        if (!cancelled) setPaymentStatus("missing");
      });

    templateService
      .list({ channel_id: channel.id, status: "approved" })
      .then((templates) => {
        if (!cancelled) setTemplateCount(templates.length);
      })
      .catch(() => {
        if (!cancelled) setTemplateCount(0);
      });

    channelHealthService
      .check(channel.id)
      .then((result) => {
        if (!cancelled) setHealthy(result.healthy);
      })
      .catch(() => {
        if (!cancelled) setHealthy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [channel.id]);

  async function handleDelete() {
    if (!confirm(`Delete channel "${channel.label}"?`)) return;
    setError(null);
    setLoading(true);
    try {
      await channelCommandService.deleteChannel(channel.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete channel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">WhatsApp</h3>
            <ChannelStatusBadge status={channel.status} />
            {channel.is_coex ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                Coex
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{channel.label}</p>
          {channel.phone_number ? (
            <p className="text-sm text-muted-foreground">{channel.phone_number}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No number linked</p>
          )}
        </div>

        {canManage ? (
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-destructive"
            disabled={loading}
            onClick={() => void handleDelete()}
          >
            Delete
          </button>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Connected</dt>
          <dd className="font-medium capitalize">{channel.status}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Payment</dt>
          <dd className="font-medium">
            {paymentStatus === "loading"
              ? "Checking..."
              : paymentStatus === "configured"
                ? "Configured"
                : "Not Configured"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Templates</dt>
          <dd className="font-medium">
            {templateCount === null ? "—" : `${templateCount} Synced`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Health</dt>
          <dd className="font-medium">
            {healthy === null ? "—" : healthy ? "Healthy" : "Needs Attention"}
          </dd>
        </div>
      </dl>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {channel.status === "connected" ? (
        <ChannelSyncSection channelId={channel.id} canManage={canManage} />
      ) : null}
    </div>
  );
}
