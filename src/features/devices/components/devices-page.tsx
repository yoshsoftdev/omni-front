"use client";

import { useCallback, useEffect, useState } from "react";

import { ChannelCard } from "@/features/channels/components/channel-card";
import { EmbeddedSignupPrimaryCard } from "@/features/channels/components/embedded-signup-primary-card";
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
  const [showManualConnect, setShowManualConnect] = useState(false);

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
        <h1 className="text-2xl font-semibold tracking-tight">Connect WhatsApp</h1>
        <p className="text-muted-foreground">
          Link your WhatsApp Business channel for inbox messaging and template-based broadcasts.
        </p>
      </div>

      {canManage ? (
        <div className="space-y-6">
          <EmbeddedSignupPrimaryCard />

          <div className="rounded-lg border border-dashed bg-muted/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Advanced</p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                    Developer
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Already have an existing WhatsApp Business Account?
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setShowManualConnect((value) => !value)}
              >
                {showManualConnect ? "Hide Manual Connect" : "Manual Connect"}
              </button>
            </div>

            {showManualConnect ? (
              <div className="mt-4">
                <ManualConnectForm onConnected={loadChannels} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading channels...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : channels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No channels yet. Use <strong>Continue with Meta</strong> above to connect WhatsApp.
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Connected Channels</h2>
          <div className="grid gap-4">
            {channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onChanged={loadChannels} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
