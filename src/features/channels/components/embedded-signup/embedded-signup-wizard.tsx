"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, MessageSquare, Phone, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmbeddedSignupConnectedSummary } from "@/features/channels/components/embedded-signup/embedded-signup-connected-summary";
import { EmbeddedSignupLaunchCard } from "@/features/channels/components/embedded-signup/embedded-signup-launch-card";
import { EmbeddedSignupLayout } from "@/features/channels/components/embedded-signup/embedded-signup-layout";
import { EmbeddedSignupPaymentStep } from "@/features/channels/components/embedded-signup/embedded-signup-payment-step";
import { EmbeddedSignupSyncStep } from "@/features/channels/components/embedded-signup/embedded-signup-sync-step";
import { EmbeddedSignupProgress } from "@/features/channels/components/embedded-signup/embedded-signup-progress";
import { EmbeddedSignupSuccess } from "@/features/channels/components/embedded-signup/embedded-signup-success";
import { useMetaEmbeddedSignup } from "@/features/channels/hooks/use-meta-embedded-signup";
import { channelPaymentService } from "@/features/channels/services/channel-payment.service";
import { embeddedSignupService } from "@/features/channels/services/embedded-signup.service";
import { channelsApiService } from "@/features/channels/services/channels-api.service";
import {
  allRequirementsReady,
  useEmbeddedSignupStore,
} from "@/features/channels/store/embedded-signup-store";
import { cn } from "@/lib/utils";

const STEP_LABELS = {
  about: "About Embedded Signup",
  requirements: "Requirements Check",
  launch: "Launch Signup",
  waiting: "Connecting",
  connected: "Connected",
  sync: "Sync Data",
  payment: "Payment",
  success: "Complete",
} as const;

export function EmbeddedSignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: sdkError, launch, launching, enabled, loading: sdkLoading } = useMetaEmbeddedSignup();

  const {
    step,
    returnTo,
    channelId,
    requirements,
    progressState,
    result,
    setStep,
    setChannelId,
    setReturnTo,
    toggleRequirement,
    setProgressState,
    setResult,
  } = useEmbeddedSignupStore();

  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const paramChannelId = searchParams.get("channelId");
    const paramReturnTo = searchParams.get("returnTo");
    if (paramChannelId) setChannelId(paramChannelId);
    if (paramReturnTo) setReturnTo(paramReturnTo);
  }, [searchParams, setChannelId, setReturnTo]);

  const requirementsReady = allRequirementsReady(requirements);

  async function handleStartSetup() {
    if (!enabled) {
      setError("Meta Embedded Signup is not configured on this environment.");
      return;
    }

    setError(null);
    setStep("waiting");
    setProgressState("initializing");

    try {
      let activeChannelId = channelId;
      if (!activeChannelId) {
        const placeholder = await channelsApiService.createEmbeddedPlaceholder("WhatsApp Business");
        activeChannelId = placeholder.id;
        setChannelId(activeChannelId);
      }

      const session = await embeddedSignupService.start(activeChannelId);
      setProgressState("waiting_user_action");
      const launchResult = await launch();

      if (!launchResult.phoneNumberId) {
        throw new Error("Phone Number ID was not received from Meta. Complete the Meta signup window.");
      }

      setProgressState("verifying_assets");
      const completed = await embeddedSignupService.complete(activeChannelId, session.session_id, {
        code: launchResult.code,
        oauth_state: session.oauth_state,
        business_id: launchResult.businessId,
        waba_id: launchResult.wabaId,
        phone_number_id: launchResult.phoneNumberId,
      });

      setResult({
        channel_id: completed.channel_id,
        phone_number: completed.phone_number ?? "",
        waba_id: completed.waba_id ?? launchResult.wabaId,
        business_id: completed.business_id ?? launchResult.businessId,
        phone_number_id: completed.phone_number_id ?? launchResult.phoneNumberId,
      });
      setProgressState("completed");
      setStep("connected");
    } catch (err) {
      setProgressState("initializing");
      setStep("launch");
      setError(err instanceof Error ? err.message : "Embedded signup failed");
    }
  }

  async function handleAddPayment() {
    if (!result?.channel_id) return;
    setPaymentLoading(true);
    setError(null);
    try {
      const url = await channelPaymentService.createPaymentLink(result.channel_id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open payment setup");
    } finally {
      setPaymentLoading(false);
    }
  }

  function goNext() {
    if (step === "about") setStep("requirements");
    else if (step === "requirements" && requirementsReady) setStep("launch");
  }

  function goBack() {
    if (step === "requirements") setStep("about");
    else if (step === "launch") setStep("requirements");
  }

  const displayError = error ?? sdkError;

  return (
    <EmbeddedSignupLayout
      title={STEP_LABELS[step]}
      description="Connect your WhatsApp Business channel using Meta Embedded Signup (Coexistence)."
      returnHref={returnTo}
    >
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {(["about", "requirements", "launch", "waiting", "connected", "sync", "payment", "success"] as const).map(
          (item, index) => (
            <span
              key={item}
              className={cn(
                "rounded-full px-2 py-0.5",
                step === item ? "bg-primary/10 font-medium text-primary" : "",
              )}
            >
              {index + 1}. {STEP_LABELS[item]}
            </span>
          ),
        )}
      </div>

      {displayError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {displayError}
        </div>
      ) : null}

      {step === "about" ? (
        <div className="space-y-5 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">What is WhatsApp Business Platform?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Embedded Signup connects your existing WhatsApp Business App to Omni-Chan via Meta Cloud API
              (Coexistence). You keep using the mobile app while Omni-Chan handles campaigns, inbox, and
              automation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={Building2}
              title="Business Account"
              text="Links your Meta Business Manager and WhatsApp Business Account (WABA)."
            />
            <InfoCard
              icon={Phone}
              title="WhatsApp Number"
              text="Connects the phone number used on WhatsApp Business App."
            />
            <InfoCard
              icon={MessageSquare}
              title="Templates"
              text="Imports approved message templates for campaign broadcasting."
            />
            <InfoCard
              icon={Shield}
              title="Permissions"
              text="Grants Omni-Chan permission to send messages and manage templates."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={goNext}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === "requirements" ? (
        <div className="space-y-5 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Requirements check</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm each requirement before launching embedded signup.
            </p>
          </div>

          <ul className="space-y-2">
            {requirements.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleRequirement(item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    item.ready
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : "hover:border-primary/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      item.ready
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {item.ready ? "Ready" : "Missing"}
                  </span>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goNext} disabled={!requirementsReady}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === "launch" ? (
        <div className="space-y-4">
          <EmbeddedSignupLaunchCard
            onStart={() => void handleStartSetup()}
            disabled={sdkLoading || launching || !enabled}
          />
          <div className="flex justify-start">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === "waiting" ? (
        <EmbeddedSignupProgress state={progressState} error={displayError} />
      ) : null}

      {step === "connected" && result ? (
        <EmbeddedSignupConnectedSummary result={result} onContinue={() => setStep("sync")} />
      ) : null}

      {step === "sync" && result ? (
        <EmbeddedSignupSyncStep
          channelId={result.channel_id}
          onSkip={() => setStep("payment")}
          onComplete={() => setStep("payment")}
        />
      ) : null}

      {step === "payment" && result ? (
        <div className="space-y-4">
          <EmbeddedSignupPaymentStep
            loading={paymentLoading}
            onAddPayment={() => void handleAddPayment()}
            onSkip={() => setStep("success")}
          />
        </div>
      ) : null}

      {step === "success" && result ? (
        <div className="space-y-4">
          <EmbeddedSignupSuccess result={result} />
          <Button variant="outline" onClick={() => router.push(returnTo)}>
            Return to {returnTo === "/onboarding" ? "Onboarding" : "Channels"}
          </Button>
        </div>
      ) : null}
    </EmbeddedSignupLayout>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Building2;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
