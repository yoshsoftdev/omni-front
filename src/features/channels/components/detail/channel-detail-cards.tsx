"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, HelpCircle, RefreshCw } from "lucide-react";

import { Alert } from "@/components/shared/alert";
import {
  DetailCard,
  InfoCell,
  StatusMetric,
} from "@/features/channels/components/detail/channel-detail-primitives";
import {
  formatConnectionMethod,
  formatDateTime,
  formatRelativeSync,
  type ChannelKind,
} from "@/features/channels/utils/channel-display";
import type { Channel } from "@/features/channels/types/channel";
import { cn } from "@/lib/utils";

export type StatusMetricItem = {
  label: string;
  value: string;
  ok: boolean;
};

export function ChannelStatusCard({
  metrics,
  footer,
}: {
  metrics: StatusMetricItem[];
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">Status</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <StatusMetric key={m.label} label={m.label} value={m.value} ok={m.ok} />
        ))}
      </div>
      {footer}
    </section>
  );
}

export function ChannelInfoGridCard({
  title,
  description,
  icon,
  action,
  items,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  items: { label: string; value: string; positive?: boolean }[];
}) {
  return (
    <DetailCard title={title} description={description} icon={icon} action={action}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <InfoCell key={item.label} label={item.label} value={item.value} positive={item.positive} />
        ))}
      </div>
    </DetailCard>
  );
}

export function ChannelConnectionCard({
  channel,
  lastSyncAt,
  onRefreshSync,
  showConnectedSince = true,
  extraItems,
}: {
  channel: Channel;
  lastSyncAt?: string;
  onRefreshSync: () => void;
  showConnectedSince?: boolean;
  extraItems?: { label: string; value: string }[];
}) {
  return (
    <DetailCard title="Connection Information" description="How this channel was linked to your workspace.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCell label="Connection Method" value={formatConnectionMethod(channel.connection_type)} />
        <InfoCell label="Connected By" value="—" />
        {showConnectedSince ? (
          <InfoCell
            label="Connected Since"
            value={formatDateTime(channel.last_connected_at ?? channel.created_at)}
          />
        ) : null}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last Sync</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{formatRelativeSync(lastSyncAt)}</p>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={onRefreshSync}
              aria-label="Refresh sync status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {extraItems?.map((item) => (
          <InfoCell key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </DetailCard>
  );
}

export function ChannelActivityCard({
  channel,
  kind,
  paymentStatus,
}: {
  channel: Channel;
  kind: ChannelKind;
  paymentStatus?: "configured" | "missing" | null;
}) {
  const events: { title: string; time?: string }[] = [];

  if (channel.created_at) {
    events.push({ title: "Channel created", time: channel.created_at });
  }
  if (channel.status === "connected" && channel.last_connected_at) {
    events.push({ title: "Channel connected", time: channel.last_connected_at });
  }
  if (kind === "whatsapp" && channel.phone_number) {
    events.push({
      title: "Phone number verified",
      time: channel.last_connected_at ?? channel.updated_at,
    });
  }
  if (kind === "whatsapp" && paymentStatus === "configured") {
    events.push({ title: "Payment method added", time: channel.updated_at });
  }
  if (kind === "instagram") {
    events.push({ title: "Instagram connected", time: channel.last_connected_at });
  }
  if (kind === "messenger") {
    events.push({ title: "Facebook Page connected", time: channel.last_connected_at });
  }

  return (
    <DetailCard title="Recent Activity" description="Latest events for this channel.">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="relative space-y-0">
          {events.map((event, i) => (
            <div key={`${event.title}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
              {i < events.length - 1 ? (
                <span className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-border" />
              ) : null}
              <span className="relative z-[1] mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{event.title}</p>
                {event.time ? (
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.time)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </DetailCard>
  );
}

export function ChannelAdvancedCard({
  channel,
  fields,
}: {
  channel: Channel;
  fields?: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const items =
    fields ??
    ([
      { label: "Business ID", value: channel.business_id ?? "—" },
      { label: "WABA ID", value: channel.waba_id ?? "—" },
      { label: "Phone Number ID", value: channel.phone_number_id ?? "—" },
      { label: "Connection Type", value: formatConnectionMethod(channel.connection_type) },
      { label: "Provider", value: channel.provider ?? "—" },
      { label: "Channel Type", value: channel.channel_type ?? "—" },
      { label: "Onboarding Status", value: channel.onboarding?.status ?? "—" },
      { label: "Created At", value: formatDateTime(channel.created_at) },
    ] as { label: string; value: string }[]);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">Advanced Details</h3>
          <p className="mt-1 text-xs text-muted-foreground">Technical identifiers for troubleshooting.</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-foreground">
          {open ? "Hide" : "Show"} Technical Details
          <ChevronRight className={cn("h-3.5 w-3.5 transition", open && "rotate-90")} />
        </span>
      </button>

      {open ? (
        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
          {items.map((item) => (
            <InfoCell key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted/60"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Link>
  );
}

export function ChannelQuickActionsCard({
  actions,
}: {
  actions: { href: string; icon: ComponentType<{ className?: string }>; label: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      <div className="mt-3 space-y-1">
        {actions.map((action) => (
          <QuickAction key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
}

export function ChannelReadyCard({
  isReady,
  readyMessage,
  incompleteMessage,
}: {
  isReady: boolean;
  readyMessage?: string;
  incompleteMessage?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Readiness</h3>
      <div className="mt-3">
        {isReady ? (
          <Alert variant="success" title="Everything is Ready!">
            {readyMessage ?? "Your channel is fully set up and ready to send messages."}
          </Alert>
        ) : (
          <Alert variant="warning" title="Setup Incomplete">
            {incompleteMessage ?? "Complete setup or reconnect to finish channel configuration."}
          </Alert>
        )}
      </div>
    </div>
  );
}

export function ChannelNeedHelpCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <HelpCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">Need Help?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Learn how to connect channels and manage your workspace.
          </p>
          <Link href="/onboarding" className="mt-1 inline-block text-xs font-medium text-foreground hover:underline">
            View Guides
          </Link>
        </div>
      </div>
    </div>
  );
}
