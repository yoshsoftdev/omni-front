"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderIcon } from "@/components/shared/provider-badge";
import { ManualConnectForm } from "@/features/channels/components/manual-connect-form";
import { instagramOAuthService } from "@/features/channels/services/instagram-oauth.service";
import type { ChannelKind } from "@/features/channels/utils/channel-display";
import { providerIconTone } from "@/features/channels/utils/channel-display";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Provider" },
  { id: 2, label: "Channel Info" },
  { id: 3, label: "Connection" },
  { id: 4, label: "Complete" },
] as const;

const PROVIDERS: {
  kind: ChannelKind;
  title: string;
  description: string;
}[] = [
  {
    kind: "whatsapp",
    title: "WhatsApp",
    description: "Connect WhatsApp Business via Embedded Signup (CoEx) or Manual Setup.",
  },
  {
    kind: "instagram",
    title: "Instagram",
    description: "Connect Instagram Business Account to receive messages and comments.",
  },
  {
    kind: "messenger",
    title: "Facebook Messenger",
    description: "Connect a Facebook Page to manage Messenger conversations.",
  },
];

type AddChannelModalProps = {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
  canManage: boolean;
};

export function AddChannelModal({ open, onClose, onConnected, canManage }: AddChannelModalProps) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<ChannelKind | null>(null);
  const [channelName, setChannelName] = useState("");
  const [notes, setNotes] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waMode, setWaMode] = useState<"embedded" | "manual">("embedded");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setProvider(null);
    setChannelName("");
    setNotes("");
    setConnecting(false);
    setError(null);
    setWaMode("embedded");
  }, [open]);

  if (!open) return null;

  function canGoNext() {
    if (step === 1) return provider !== null;
    if (step === 2) return channelName.trim().length > 0;
    if (step === 3) {
      if (provider === "messenger") return true;
      if (provider === "instagram") return true;
      if (provider === "whatsapp") return waMode === "embedded";
      return false;
    }
    return false;
  }

  async function handleNext() {
    setError(null);
    if (step === 3 && provider === "instagram") {
      setConnecting(true);
      try {
        const start = await instagramOAuthService.getConnectUrl(
          `${window.location.origin}/devices?instagram=connected`,
        );
        window.location.assign(start.authorization_url);
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start Instagram connect");
        setConnecting(false);
        return;
      }
    }
    if (step === 3 && provider === "whatsapp" && waMode === "embedded") {
      window.location.assign("/devices/embedded-signup?returnTo=/devices");
      return;
    }
    if (step === 3 && provider === "messenger") {
      setStep(4);
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function handleManualConnected() {
    onConnected();
    setStep(4);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-card shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-channel-title"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="add-channel-title" className="text-lg font-semibold">
            Add Channel
          </h2>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b px-5 py-4">
          <ol className="flex items-center gap-2">
            {STEPS.map((s, index) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        done || active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                    </span>
                    <span
                      className={cn(
                        "truncate text-xs font-medium",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 ? (
                    <span className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Choose a provider</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select the messaging platform you want to connect.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-1">
                {PROVIDERS.map((p) => {
                  const selected = provider === p.kind;
                  const tone = providerIconTone(p.kind);
                  return (
                    <button
                      key={p.kind}
                      type="button"
                      onClick={() => setProvider(p.kind)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-primary bg-muted ring-1 ring-primary"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                          tone.wrap,
                        )}
                      >
                        <ProviderIcon provider={p.kind} className={cn("h-5 w-5", tone.icon)} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{p.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{p.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Channel info</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Give this channel a workspace-friendly name. Connection happens in the next step.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel name</Label>
                <Input
                  id="channel-name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder={
                    provider === "whatsapp"
                      ? "e.g. Sales"
                      : provider === "instagram"
                        ? "e.g. Official"
                        : "e.g. Support Page"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-notes">Notes (optional)</Label>
                <Input
                  id="channel-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal note for your team"
                />
              </div>
            </div>
          ) : null}

          {step === 3 && provider === "whatsapp" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Connect WhatsApp</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use Embedded Signup for the recommended CoEx flow, or connect manually with Meta tokens.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={waMode === "embedded" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWaMode("embedded")}
                >
                  Embedded Signup
                </Button>
                <Button
                  type="button"
                  variant={waMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWaMode("manual")}
                >
                  Manual Setup
                </Button>
              </div>
              {waMode === "embedded" ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium">Continue with Meta Embedded Signup</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You will leave this dialog and complete the Meta CoEx wizard for “{channelName || "this channel"}”.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/devices/embedded-signup?returnTo=/devices">Open Embedded Signup</Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border p-4">
                  <ManualConnectForm onConnected={handleManualConnected} />
                </div>
              )}
            </div>
          ) : null}

          {step === 3 && provider === "instagram" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Connect Instagram</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Authorize your Instagram Business account via Meta OAuth.
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm">
                  Channel label: <span className="font-medium">{channelName || "—"}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Click Next to start Instagram OAuth. You will be redirected to Meta and returned here when done.
                </p>
              </div>
            </div>
          ) : null}

          {step === 3 && provider === "messenger" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Connect Facebook Messenger</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Facebook Page OAuth is not available yet in this workspace.
                </p>
              </div>
              <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
                <p className="text-sm font-semibold">Coming soon</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Messenger connect will let you link a Facebook Page to receive and reply to conversations.
                  You can still view Messenger channel details when a page is already linked.
                </p>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {provider === "messenger" ? "Messenger connect is coming soon" : "Channel connected"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {provider === "messenger"
                    ? "We will notify your workspace when Facebook Page linking is ready."
                    : `“${channelName || "Channel"}” is ready. You can manage it from the Channels list.`}
                </p>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 1) {
                onClose();
                return;
              }
              setStep((s) => Math.max(1, s - 1));
            }}
            disabled={connecting}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => void handleNext()}
              disabled={!canManage || !canGoNext() || connecting || (step === 3 && provider === "whatsapp" && waMode === "manual")}
            >
              {connecting ? "Connecting..." : step === 3 && provider === "instagram" ? "Connect Instagram" : "Next"}
            </Button>
          ) : (
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
