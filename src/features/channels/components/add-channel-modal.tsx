"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { ProviderIcon } from "@/components/shared/provider-badge";
import { StepWizard } from "@/components/shared/step-wizard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManualConnectForm } from "@/features/channels/components/manual-connect-form";
import { instagramOAuthService } from "@/features/channels/services/instagram-oauth.service";
import type { ChannelKind } from "@/features/channels/utils/channel-display";
import { providerIconTone } from "@/features/channels/utils/channel-display";
import { cn } from "@/lib/utils";
import { formatApiErrorMessage } from "@/services/api/errors";

type Step = "provider" | "connect" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "provider", label: "Provider" },
  { id: "connect", label: "Connect" },
  { id: "done", label: "Done" },
];

const PROVIDERS: { kind: ChannelKind; title: string; description: string; available: boolean }[] = [
  {
    kind: "whatsapp",
    title: "WhatsApp",
    description: "Connect WhatsApp Business via Embedded Signup (CoEx) or Manual Setup.",
    available: true,
  },
  {
    kind: "instagram",
    title: "Instagram",
    description: "Connect an Instagram Business account to receive and reply to messages.",
    available: true,
  },
  {
    kind: "messenger",
    title: "Facebook Messenger",
    description: "Link a Facebook Page to manage Messenger conversations.",
    available: false,
  },
];

type AddChannelModalProps = {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
  canManage: boolean;
};

export function AddChannelModal({ open, onClose, onConnected, canManage }: AddChannelModalProps) {
  const [step, setStep] = useState<Step>("provider");
  const [provider, setProvider] = useState<ChannelKind | null>(null);
  const [waMode, setWaMode] = useState<"embedded" | "manual">("embedded");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("provider");
    setProvider(null);
    setWaMode("embedded");
    setConnecting(false);
    setError(null);
  }, [open]);

  async function connectInstagram() {
    setError(null);
    setConnecting(true);
    try {
      const start = await instagramOAuthService.getConnectUrl(`${window.location.origin}/devices?instagram=connected`);
      window.location.assign(start.authorization_url);
    } catch (err) {
      setError(formatApiErrorMessage(err));
      setConnecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !connecting && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Add Channel</DialogTitle>
          <DialogDescription className="sr-only">Connect a messaging channel in three steps.</DialogDescription>
        </DialogHeader>

        <div className="border-b px-5 py-4">
          <StepWizard steps={STEPS} currentStep={step} />
        </div>

        <div className="px-5 py-5">
          {!canManage ? (
            <p className="mb-4 text-sm text-muted-foreground">Only owners and admins can connect channels.</p>
          ) : null}

          {step === "provider" ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Choose a provider</legend>
              {PROVIDERS.map((p) => {
                const selected = provider === p.kind;
                const tone = providerIconTone(p.kind);
                return (
                  <button
                    key={p.kind}
                    type="button"
                    aria-pressed={selected}
                    disabled={!p.available}
                    onClick={() => setProvider(p.kind)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      selected ? "border-primary bg-muted ring-1 ring-primary" : "enabled:hover:bg-muted/40",
                    )}
                  >
                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", tone.wrap)}>
                      <ProviderIcon provider={p.kind} className={cn("h-5 w-5", tone.icon)} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {p.title}
                        {p.available ? null : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Coming soon
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{p.description}</span>
                    </span>
                  </button>
                );
              })}
            </fieldset>
          ) : null}

          {step === "connect" && provider === "whatsapp" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Connect WhatsApp</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Embedded Signup is recommended (CoEx keeps the WhatsApp Business app working). Manual Setup uses
                  Meta system-user tokens.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Connection method">
                <Button
                  type="button"
                  variant={waMode === "embedded" ? "default" : "outline"}
                  size="sm"
                  aria-pressed={waMode === "embedded"}
                  onClick={() => setWaMode("embedded")}
                >
                  Embedded Signup
                </Button>
                <Button
                  type="button"
                  variant={waMode === "manual" ? "default" : "outline"}
                  size="sm"
                  aria-pressed={waMode === "manual"}
                  onClick={() => setWaMode("manual")}
                >
                  Manual Setup
                </Button>
              </div>
              {waMode === "embedded" ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium">Continue with Meta Embedded Signup</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You leave this dialog to finish the Meta wizard, then come back to the Channels page.
                  </p>
                  {canManage ? (
                    <Button asChild className="mt-4">
                      <Link href="/devices/embedded-signup?returnTo=/devices">Open Embedded Signup</Link>
                    </Button>
                  ) : (
                    <Button className="mt-4" disabled>
                      Open Embedded Signup
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border p-4">
                  <ManualConnectForm
                    onConnected={() => {
                      onConnected();
                      setStep("done");
                    }}
                  />
                </div>
              )}
            </div>
          ) : null}

          {step === "connect" && provider === "instagram" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Connect Instagram</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You will be sent to Meta to authorize your Instagram Business account, then returned here.
                </p>
              </div>
              <Button type="button" disabled={!canManage || connecting} onClick={() => void connectInstagram()}>
                {connecting ? "Redirecting to Meta..." : "Connect Instagram"}
              </Button>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="space-y-3 text-center" role="status">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="text-sm font-semibold">Channel connected</h3>
              <p className="text-xs text-muted-foreground">
                Check its Readiness panel: payment, business verification and templates must pass before it can send.
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 text-sm text-error-foreground">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          {step === "done" ? (
            <span />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={connecting}
              onClick={() => (step === "provider" ? onClose() : setStep("provider"))}
            >
              {step === "provider" ? "Cancel" : "Back"}
            </Button>
          )}
          {step === "provider" ? (
            <Button type="button" disabled={!canManage || !provider} onClick={() => setStep("connect")}>
              Next
            </Button>
          ) : step === "done" ? (
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
