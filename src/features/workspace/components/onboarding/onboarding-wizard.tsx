"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeviceStatusBadge } from "@/features/devices/components/device-status-badge";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { OnboardingChecklist } from "@/features/workspace/components/onboarding/onboarding-checklist";
import { OnboardingLayout } from "@/features/workspace/components/onboarding/onboarding-layout";
import { OnboardingProgress } from "@/features/workspace/components/onboarding/onboarding-progress";
import { OnboardingStepCard } from "@/features/workspace/components/onboarding/onboarding-step-card";
import { getOnboardingSnapshot } from "@/features/workspace/services/onboarding-data.service";
import { useOnboardingStore } from "@/features/workspace/store/onboarding-store";
import type { OnboardingStep, OnboardingStepSnapshot } from "@/features/workspace/types/onboarding";
import { ONBOARDING_STEPS } from "@/features/workspace/types/onboarding";
import {
  estimateMinutesRemaining,
  getCompletedOnboardingSteps,
  getRemainingOnboardingChecks,
  isOnboardingSetupComplete,
} from "@/features/workspace/utils/onboarding-progress";
import { useAuthStore } from "@/store/auth-store";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatProvider(provider: string) {
  if (provider === "meta") return "Meta WhatsApp";
  return provider;
}

export function OnboardingWizard() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "owner" || role === "admin";

  const { currentStep, setStep, markStepSkipped, markStepComplete, touch } = useOnboardingStore();
  const [snapshot, setSnapshot] = useState<OnboardingStepSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    const data = await getOnboardingSnapshot();
    setSnapshot(data);
    touch();
    return data;
  }, [touch]);

  useEffect(() => {
    loadSnapshot()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load onboarding"))
      .finally(() => setLoading(false));
  }, [loadSnapshot]);

  const readiness = snapshot?.readiness;
  const completedSteps = useMemo(
    () => (readiness ? getCompletedOnboardingSteps(readiness) : []),
    [readiness],
  );
  const progressPercent = readiness?.score ?? 0;
  const estimatedMinutesRemaining = readiness ? estimateMinutesRemaining(readiness) : 21;
  const setupComplete = readiness ? isOnboardingSetupComplete(readiness) : false;
  const remainingChecks = readiness ? getRemainingOnboardingChecks(readiness) : [];

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      await loadSnapshot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSyncTemplates() {
    setSyncing(true);
    setError(null);
    try {
      const channel = await channelQueryService.getDefaultChannel();
      if (!channel) {
        setError("Connect a WhatsApp channel before syncing templates.");
        return;
      }
      await templateService.sync(channel.id);
      await loadSnapshot();
      markStepComplete("sync_templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  }

  function goToStep(step: OnboardingStep) {
    if (step === 6 && !setupComplete) {
      setError("Complete all required setup steps before finishing onboarding.");
      return;
    }
    setStep(step);
    setError(null);
  }

  function handleContinue() {
    if (!readiness) return;
    if (currentStep === 5) {
      if (!setupComplete) {
        setError("Finish the required items below before completing setup.");
        return;
      }
      goToStep(6);
      return;
    }
    if (currentStep < 6) {
      goToStep((currentStep + 1) as OnboardingStep);
    }
  }

  function handleSkip(stepId: Parameters<typeof markStepSkipped>[0]) {
    markStepSkipped(stepId);
    if (currentStep < 6) {
      goToStep((currentStep + 1) as OnboardingStep);
    }
  }

  function autoMarkIfComplete() {
    if (!readiness) return;
    readiness.checks.forEach((check) => {
      if (check.completed) {
        const stepMap: Record<string, Parameters<typeof markStepComplete>[0]> = {
          meta_connected: "connect_whatsapp",
          payment_method: "connect_whatsapp",
          templates_synced: "sync_templates",
          contacts_available: "import_contacts",
          team_members_added: "invite_team",
          campaign_created: "create_campaign",
        };
        const stepId = stepMap[check.id];
        if (stepId) markStepComplete(stepId);
      }
    });
  }

  useEffect(() => {
    autoMarkIfComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readiness?.completedCount]);

  const stepDefinition = ONBOARDING_STEPS.find((step) => step.step === currentStep);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading onboarding wizard...
      </div>
    );
  }

  return (
    <OnboardingLayout
      sidebar={
        <OnboardingProgress
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          progressPercent={progressPercent}
          estimatedMinutesRemaining={estimatedMinutesRemaining}
        />
      }
    >
      {error ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {currentStep === 1 && snapshot ? (
        <OnboardingStepCard
          title="Connect WhatsApp"
          description={stepDefinition?.description ?? ""}
          primaryAction={{ label: "Connect WhatsApp", href: "/devices/embedded-signup?returnTo=/onboarding" }}
          secondaryAction={{ label: "Refresh Status", onClick: handleRefresh, disabled: refreshing }}
          skipAction={{
            label: "Skip",
            onClick: () => handleSkip("connect_whatsapp"),
            hidden: !isAdmin,
          }}
        >
          {snapshot.connectedChannels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No connected channels yet.</p>
          ) : (
            <ul className="space-y-3">
              {snapshot.connectedChannels.map((channel) => (
                <li key={channel.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{channel.label}</span>
                    <DeviceStatusBadge status={channel.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {channel.phone_number ?? "No number linked"} · {formatProvider(channel.provider)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </OnboardingStepCard>
      ) : null}

      {currentStep === 2 && snapshot ? (
        <OnboardingStepCard
          title="Sync Templates"
          description={stepDefinition?.description ?? ""}
          primaryAction={{
            label: syncing ? "Syncing..." : "Sync Templates",
            onClick: handleSyncTemplates,
            disabled: syncing || snapshot.connectedChannels.length === 0,
          }}
          secondaryAction={{ label: "Refresh", onClick: handleRefresh, disabled: refreshing }}
          skipAction={{ label: "Skip", onClick: () => handleSkip("sync_templates") }}
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <Metric label="Template Count" value={String(snapshot.templateCount)} />
            <Metric label="Last Sync" value={formatDateTime(snapshot.lastTemplateSync)} />
            <Metric label="Connected Channels" value={String(snapshot.connectedChannels.length)} />
          </dl>
          {snapshot.templates.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {snapshot.templates.slice(0, 5).map((template) => (
                <li key={template.id} className="rounded-md border px-3 py-2">
                  <span className="font-medium">{template.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{template.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No templates synced yet.</p>
          )}
        </OnboardingStepCard>
      ) : null}

      {currentStep === 3 && snapshot ? (
        <OnboardingStepCard
          title="Import Contacts"
          description={stepDefinition?.description ?? ""}
          primaryAction={{ label: "Import CSV", href: "/contacts/import" }}
          secondaryAction={{ label: "Manual Contact", href: "/contacts" }}
          skipAction={{ label: "Skip", onClick: () => handleSkip("import_contacts") }}
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="Total Contacts" value={snapshot.totalContacts.toLocaleString()} />
            <Metric label="Imported Contacts" value={snapshot.importedContacts.toLocaleString()} />
          </dl>
          <div>
            <h3 className="text-sm font-medium">Recent Imports</h3>
            {snapshot.recentImports.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No imports recorded yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {snapshot.recentImports.map((item) => (
                  <li key={item.id} className="flex justify-between rounded-md border px-3 py-2">
                    <span>
                      {item.name} <span className="text-xs text-muted-foreground">({item.source})</span>
                    </span>
                    <span className="text-muted-foreground">
                      {item.count.toLocaleString()} · {formatDateTime(item.imported_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/contacts/import">Import Excel</Link>
          </Button>
        </OnboardingStepCard>
      ) : null}

      {currentStep === 4 && snapshot ? (
        <OnboardingStepCard
          title="Invite Team Members"
          description={stepDefinition?.description ?? ""}
          primaryAction={{ label: "Invite Member", href: "/team/users" }}
          secondaryAction={{ label: "Manage Roles", href: "/team/roles" }}
          skipAction={{ label: "Skip", onClick: () => handleSkip("invite_team") }}
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="Workspace Members" value={String(snapshot.members.length)} />
            <Metric label="Pending Invites" value={String(snapshot.pendingInvites.length)} />
          </dl>
          <ul className="space-y-2 text-sm">
            {snapshot.members.slice(0, 6).map((member) => (
              <li key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>
                  {member.name} <span className="text-xs text-muted-foreground">({member.email})</span>
                </span>
                <span className="text-xs capitalize text-muted-foreground">{member.role}</span>
              </li>
            ))}
          </ul>
        </OnboardingStepCard>
      ) : null}

      {currentStep === 5 && snapshot ? (
        <OnboardingStepCard
          title="Create First Campaign"
          description={stepDefinition?.description ?? ""}
          primaryAction={{ label: "Create Campaign", href: "/broadcast/campaigns/create" }}
          secondaryAction={{ label: "View Campaigns", href: "/broadcast/campaigns" }}
          skipAction={{ label: "Skip", onClick: () => handleSkip("create_campaign") }}
        >
          <Metric label="Existing Campaigns" value={String(snapshot.campaigns.length)} />
          {snapshot.campaigns.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {snapshot.campaigns.slice(0, 5).map((campaign) => (
                <li key={campaign.id} className="flex justify-between rounded-md border px-3 py-2">
                  <span className="font-medium">{campaign.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{campaign.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No campaigns created yet.</p>
          )}
        </OnboardingStepCard>
      ) : null}

      {currentStep === 6 && snapshot && readiness ? (
        setupComplete ? (
          <OnboardingStepCard
            title="Complete Setup"
            description="Your workspace is ready to send WhatsApp campaigns."
            primaryAction={{
              label: "Go to Dashboard",
              onClick: () => router.push("/dashboard"),
            }}
            secondaryAction={{
              label: "Create Another Campaign",
              href: "/broadcast/campaigns/create",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                <span className="text-2xl font-semibold text-primary">{readiness.score}%</span>
              </div>
              <div>
                <p className="font-medium">Workspace readiness score</p>
                <p className="text-sm text-muted-foreground">
                  {readiness.completedCount} of {readiness.totalCount} setup items complete
                </p>
              </div>
            </div>
            <OnboardingChecklist
              items={readiness.checks.map((check) => ({
                ...check,
                label: check.label,
              }))}
              title="Completed setup"
            />
            <div>
              <h3 className="text-sm font-semibold">Next recommended actions</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>• Open Inbox to monitor replies</li>
                <li>• Review campaign schedules and reports</li>
                <li>• Invite more team members as you scale</li>
              </ul>
            </div>
          </OnboardingStepCard>
        ) : (
          <OnboardingStepCard
            title="Complete Setup"
            description="Finish the required steps below before completing onboarding."
            primaryAction={{ label: "Continue Setup", onClick: () => goToStep(1) }}
            secondaryAction={{ label: "Refresh Status", onClick: handleRefresh, disabled: refreshing }}
          >
            <OnboardingChecklist
              items={remainingChecks}
              title="Missing requirements"
              description="These items must be completed before you can finish setup."
            />
          </OnboardingStepCard>
        )
      ) : null}

      {currentStep < 6 ? (
        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => goToStep((currentStep - 1) as OnboardingStep)}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            <Button onClick={handleContinue}>
              {currentStep === 5 ? "Review Setup" : "Continue"}
            </Button>
          </div>
        </div>
      ) : null}
    </OnboardingLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
