"use client";

import { useCallback, useEffect, useState } from "react";
import { Instagram, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChannelCard } from "@/features/channels/components/channel-card";
import { EmbeddedSignupPrimaryCard } from "@/features/channels/components/embedded-signup-primary-card";
import { ManualConnectForm } from "@/features/channels/components/manual-connect-form";
import { instagramOAuthService } from "@/features/channels/services/instagram-oauth.service";
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
  const [showWhatsAppConnect, setShowWhatsAppConnect] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramName, setInstagramName] = useState<string | null>(null);
  const [instagramBusy, setInstagramBusy] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);

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

  const loadInstagramStatus = useCallback(async () => {
    try {
      const status = await instagramOAuthService.getStatus();
      setInstagramConnected(Boolean(status.connected));
      setInstagramName(status.username ?? null);
    } catch {
      setInstagramConnected(false);
      setInstagramName(null);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
    void loadInstagramStatus();
  }, [loadChannels, loadInstagramStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const instagramResult = params.get("instagram");
    if (!instagramResult) return;
    if (instagramResult === "connected") {
      void loadInstagramStatus();
      void loadChannels();
    } else if (instagramResult === "error") {
      setInstagramError(params.get("message") ?? "Instagram connection failed");
    }
    params.delete("instagram");
    params.delete("username");
    params.delete("account_type");
    params.delete("message");
    const next = params.toString();
    const nextUrl = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [loadChannels, loadInstagramStatus]);

  const whatsappConnected = channels.some((channel) => channel.status === "connected");

  async function handleConnectInstagram() {
    if (!canManage || instagramBusy) return;
    setInstagramBusy(true);
    setInstagramError(null);
    try {
      const returnUrl =
        typeof window !== "undefined" ? `${window.location.origin}/devices?instagram=connected` : undefined;
      const start = await instagramOAuthService.getConnectUrl(returnUrl);
      window.location.assign(start.authorization_url);
    } catch (err) {
      setInstagramError(err instanceof Error ? err.message : "Failed to start Instagram login");
      setInstagramBusy(false);
    }
  }

  async function handleDisconnectInstagram() {
    if (!canManage || instagramBusy) return;
    setInstagramBusy(true);
    setInstagramError(null);
    try {
      await instagramOAuthService.disconnect();
      await loadInstagramStatus();
      await loadChannels();
    } catch (err) {
      setInstagramError(err instanceof Error ? err.message : "Failed to disconnect Instagram");
    } finally {
      setInstagramBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground">
          Connect messaging channels independently. WhatsApp and Instagram onboarding do not affect each other.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">WhatsApp Business</h2>
              <p className="text-sm text-muted-foreground">Embedded Signup (Coexistence)</p>
              <p className="mt-2 text-sm">
                Status:{" "}
                <span className={whatsappConnected ? "font-medium text-emerald-700" : "font-medium text-muted-foreground"}>
                  {loading ? "Checking..." : whatsappConnected ? "Connected" : "Not Connected"}
                </span>
              </p>
            </div>
          </div>

          {canManage ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant={showWhatsAppConnect ? "outline" : "default"}
                onClick={() => setShowWhatsAppConnect((value) => !value)}
              >
                {showWhatsAppConnect ? "Hide Connect WhatsApp" : "Connect WhatsApp"}
              </Button>

              {showWhatsAppConnect ? (
                <div className="space-y-4 border-t pt-4">
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ask an admin to connect WhatsApp for this workspace.</p>
          )}
        </section>

        <section className="space-y-4 rounded-lg border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-pink-700">
              <Instagram className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">Instagram Business</h2>
              <p className="text-sm text-muted-foreground">Instagram Messaging</p>
              <p className="mt-2 text-sm">
                Status:{" "}
                <span className={instagramConnected ? "font-medium text-pink-700" : "font-medium text-muted-foreground"}>
                  {instagramConnected
                    ? `Connected${instagramName ? ` · ${instagramName}` : ""}`
                    : "Not Connected"}
                </span>
              </p>
            </div>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {instagramConnected ? (
                <Button type="button" variant="outline" disabled={instagramBusy} onClick={() => void handleDisconnectInstagram()}>
                  {instagramBusy ? "Working..." : "Disconnect Instagram"}
                </Button>
              ) : (
                <Button type="button" disabled={instagramBusy} onClick={() => void handleConnectInstagram()}>
                  {instagramBusy ? "Redirecting..." : "Connect Instagram"}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ask an admin to connect Instagram for this workspace.</p>
          )}
          {instagramError ? <p className="text-xs text-destructive">{instagramError}</p> : null}
          <p className="text-xs text-muted-foreground">
            Uses Instagram Business Login. Requires a Professional Instagram account (Business or Creator).
          </p>
        </section>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading channels...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : channels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No WhatsApp channels yet. Use <strong>Connect WhatsApp</strong> above to start Embedded Signup.
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
