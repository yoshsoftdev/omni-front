"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, MessageSquare, Phone, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmbeddedSignupLaunchCard } from "@/features/channels/components/embedded-signup/embedded-signup-launch-card";
import { EmbeddedSignupLayout } from "@/features/channels/components/embedded-signup/embedded-signup-layout";
import { EmbeddedSignupProgress } from "@/features/channels/components/embedded-signup/embedded-signup-progress";
import { EmbeddedSignupSuccess } from "@/features/channels/components/embedded-signup/embedded-signup-success";
import { useMetaEmbeddedSignup } from "@/features/channels/hooks/use-meta-embedded-signup";
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
  success: "Success",
} as const;

export function EmbeddedSignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: sdkError } = useMetaEmbeddedSignup();

  const {
    step,
    returnTo,
    requirements,
    progressState,
    result,
    setStep,
    setChannelId,
    setReturnTo,
    toggleRequirement,
  } = useEmbeddedSignupStore();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramChannelId = searchParams.get("channelId");
    const paramReturnTo = searchParams.get("returnTo");
    if (paramChannelId) setChannelId(paramChannelId);
    if (paramReturnTo) setReturnTo(paramReturnTo);
  }, [searchParams, setChannelId, setReturnTo]);

  const requirementsReady = allRequirementsReady(requirements);

  function handleStartSetup() {
    setError("Embedded Signup is not available yet. Waiting for Meta App Review.");
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
      <div className="flex gap-2 text-xs text-muted-foreground">
        {(["about", "requirements", "launch", "waiting", "success"] as const).map((item, index) => (
          <span
            key={item}
            className={cn(
              "rounded-full px-2 py-0.5",
              step === item ? "bg-primary/10 font-medium text-primary" : "",
            )}
          >
            {index + 1}. {STEP_LABELS[item]}
          </span>
        ))}
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
            disabled
          />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Coming Soon — Waiting for Meta App Review
          </p>
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

      {step === "success" && result ? (
        <div className="space-y-4">
          <EmbeddedSignupSuccess result={result} />
          <Button variant="outline" onClick={() => router.push(returnTo)}>
            Return to {returnTo === "/onboarding" ? "Onboarding" : "Dashboard"}
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
