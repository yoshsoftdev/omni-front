"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChannelStatusBadge } from "@/features/channels/components/channel-status-badge";
import { channelCommandService } from "@/features/channels/services/channel-command.service";
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{channel.label}</h3>
            <ChannelStatusBadge status={channel.status} />
            {channel.is_coex ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                Coex
              </span>
            ) : null}
          </div>
          {channel.phone_number ? (
            <p className="text-sm text-muted-foreground">{channel.phone_number}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No number linked</p>
          )}
          {channel.waba_id ? (
            <p className="text-xs text-muted-foreground">WABA: {channel.waba_id}</p>
          ) : null}
          {channel.phone_number_id ? (
            <p className="text-xs text-muted-foreground">Phone Number ID: {channel.phone_number_id}</p>
          ) : null}
        </div>

        {canManage ? (
          <Button size="sm" variant="ghost" disabled={loading} onClick={handleDelete}>
            Delete
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
