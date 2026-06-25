"use client";

import { useCallback, useEffect, useState } from "react";

import { ChannelCard } from "@/features/channels/components/channel-card";
import { EmbeddedSignupComingSoonCard } from "@/features/channels/components/embedded-signup-coming-soon-card";
import { ManualConnectForm } from "@/features/channels/components/manual-connect-form";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { useAuthStore } from "@/store/auth-store";

export function DevicesPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setError(null);
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
    loadChannels();
  }, [loadChannels]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Channels</h1>
        <p className="text-muted-foreground">
          Manage WhatsApp Business channels for broadcasts and inbox messaging.
        </p>
      </div>

      {canManage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <EmbeddedSignupComingSoonCard />
          <ManualConnectForm onConnected={loadChannels} />
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading channels...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : channels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No channels yet. Connect a WhatsApp channel using Manual Connection above.
        </div>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} onChanged={loadChannels} />
          ))}
        </div>
      )}
    </div>
  );
}
