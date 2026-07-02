"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getWorkspaceReadiness } from "@/features/workspace/services/workspace-readiness.service";
import { dashboardService } from "@/features/workspace/services/dashboard.service";
import type {
  QuickAction,
  ReadinessCheck,
  WorkspaceReadiness,
} from "@/features/workspace/types/workspace-readiness";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const STATUS_COPY = {
  not_started: {
    title: "Get started with your workspace",
    description: "Complete the onboarding checklist to start sending WhatsApp campaigns.",
  },
  in_progress: {
    title: "Workspace setup in progress",
    description: "You are on your way. Finish the remaining steps to go live.",
  },
  ready: {
    title: "Workspace is ready",
    description: "Core onboarding steps are complete. You can run campaigns with confidence.",
  },
} as const;

const QUICK_ACTION_ICONS: Record<QuickAction["id"], typeof Smartphone> = {
  connect_whatsapp: Smartphone,
  add_payment: CreditCard,
  sync_templates: MessageSquare,
  import_contacts: Upload,
  invite_team: UserPlus,
  create_campaign: Megaphone,
};

const CHECK_ICONS: Record<ReadinessCheck["id"], typeof Smartphone> = {
  meta_connected: Smartphone,
  payment_method: CreditCard,
  templates_synced: MessageSquare,
  existing_data_synced: RefreshCw,
  contacts_available: Users,
  team_members_added: UserPlus,
  campaign_created: Megaphone,
};

export function WorkspaceReadinessDashboard() {
  const team = useAuthStore((state) => state.team);
  const [readiness, setReadiness] = useState<WorkspaceReadiness | null>(null);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof dashboardService.getOverview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getWorkspaceReadiness(), dashboardService.getOverview()])
      .then(([nextReadiness, nextOverview]) => {
        setReadiness(nextReadiness);
        setOverview(nextOverview);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load workspace readiness"))
      .finally(() => setLoading(false));
  }, []);

  const statusCopy = readiness ? STATUS_COPY[readiness.status] : STATUS_COPY.not_started;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Track onboarding progress and launch your WhatsApp workspace."
        right={
          <Button variant="outline" size="sm" asChild>
            <Link href="/onboarding">Continue Setup</Link>
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">Loading workspace readiness...</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-sm text-destructive">{error}</div>
      ) : readiness ? (
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace Status</p>
                <h2 className="mt-1 text-xl font-semibold">{team?.name ?? "Your Workspace"}</h2>
                <p className="mt-2 text-sm font-medium">{statusCopy.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{statusCopy.description}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {readiness.completedCount} of {readiness.totalCount} steps complete
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-primary/15 bg-primary/5">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-primary">{readiness.score}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ready</div>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Onboarding readiness</span>
                  <span className="text-muted-foreground">{readiness.score}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${readiness.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </section>

          {overview ? (
            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-sm font-semibold">Meta Synchronization</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Last sync timestamps and permission status across connected channels.
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Last Contact Sync</dt>
                  <dd className="font-medium">
                    {overview.last_contact_sync_at
                      ? new Date(overview.last_contact_sync_at).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last Template Sync</dt>
                  <dd className="font-medium">
                    {overview.last_template_sync_at
                      ? new Date(overview.last_template_sync_at).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last Conversation Sync</dt>
                  <dd className="font-medium">
                    {overview.last_conversation_sync_at
                      ? new Date(overview.last_conversation_sync_at).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Permission Status</dt>
                  <dd className="font-medium capitalize">{overview.permission_status || "Unknown"}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-sm font-semibold">Readiness Checklist</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete each item to prepare your workspace for WhatsApp broadcasting.
            </p>
            <ul className="mt-4 space-y-3">
              {readiness.checks.map((check) => {
                const Icon = CHECK_ICONS[check.id];
                return (
                  <li
                    key={check.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-4 py-3",
                      check.completed ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "bg-muted/20",
                    )}
                  >
                    {check.completed ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{check.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{check.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-sm font-semibold">Quick Actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Jump to the next setup task.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {readiness.quickActions.map((action) => {
                const Icon = QUICK_ACTION_ICONS[action.id];
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="group rounded-lg border bg-muted/20 p-4 transition-colors hover:border-primary/40 hover:bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium group-hover:text-primary">{action.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => {
                setLoading(true);
                Promise.all([getWorkspaceReadiness(), dashboardService.getOverview()])
                  .then(([nextReadiness, nextOverview]) => {
                    setReadiness(nextReadiness);
                    setOverview(nextOverview);
                  })
                  .finally(() => setLoading(false));
              }}>
                Refresh readiness
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
