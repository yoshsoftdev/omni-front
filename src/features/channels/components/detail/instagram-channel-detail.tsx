"use client";

import { BarChart3, Briefcase, Inbox, Link2, Send, Users, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/shared/provider-badge";
import { ChannelSyncSection } from "@/features/channels/components/channel-sync-section";
import {
  ChannelActivityCard,
  ChannelAdvancedCard,
  ChannelConnectionCard,
  ChannelInfoGridCard,
  ChannelNeedHelpCard,
  ChannelQuickActionsCard,
  ChannelReadyCard,
  ChannelStatusCard,
} from "@/features/channels/components/detail/channel-detail-cards";
import {
  ChannelDetailHeader,
  ChannelDetailShell,
} from "@/features/channels/components/detail/channel-detail-header";
import type { Channel } from "@/features/channels/types/channel";
import {
  connectionStatusLabel,
  formatDateTime,
  formatRelativeSync,
  formatSecondaryIdentifier,
} from "@/features/channels/utils/channel-display";

type InstagramChannelDetailProps = {
  channel: Channel;
  whatsappChannels: Channel[];
  canManage: boolean;
  detailLoading: boolean;
  lastSyncAt?: string;
  showSyncSection: boolean;
  onShowSync: () => void;
  onRefresh: () => void;
  onDelete: () => void;
};

export function InstagramChannelDetail({
  channel,
  whatsappChannels,
  canManage,
  detailLoading,
  lastSyncAt,
  showSyncSection,
  onShowSync,
  onRefresh,
  onDelete,
}: InstagramChannelDetailProps) {
  const isReady = channel.status === "connected";
  const handle = formatSecondaryIdentifier(channel, "instagram");
  const username = handle === "—" ? "—" : handle.replace(/^@/, "");

  function openInstagram() {
    if (username === "—") return;
    window.open(`https://instagram.com/${username}`, "_blank", "noopener,noreferrer");
  }

  return (
    <ChannelDetailShell
      main={
        <>
          <ChannelDetailHeader
            channel={channel}
            kind="instagram"
            secondaryLine={handle}
            openExternalLabel="Open in Instagram"
            canManage={canManage}
            onReconnect={onShowSync}
            onOpenExternal={openInstagram}
            openExternalDisabled={username === "—"}
            onDelete={onDelete}
          />

          <ChannelStatusCard
            metrics={[
              {
                label: "Connection",
                value: connectionStatusLabel(channel.status),
                ok: channel.status === "connected",
              },
              {
                label: "Business Account",
                value: detailLoading ? "Checking..." : channel.status === "connected" ? "Verified" : "—",
                ok: channel.status === "connected",
              },
              {
                label: "Instagram Account",
                value: detailLoading ? "Checking..." : channel.status === "connected" ? "Active" : "Inactive",
                ok: channel.status === "connected",
              },
              {
                label: "Last Sync",
                value: formatRelativeSync(lastSyncAt ?? channel.updated_at),
                ok: Boolean(lastSyncAt ?? channel.updated_at),
              },
            ]}
            footer={
              canManage && showSyncSection ? (
                <div className="mt-5 rounded-lg border bg-background p-4">
                  <ChannelSyncSection channelId={channel.id} canManage={canManage} />
                </div>
              ) : null
            }
          />

          <ChannelInfoGridCard
            title="Business Information"
            description="Instagram professional account profile."
            icon={<Briefcase className="h-4 w-4" />}
            items={[
              { label: "Account Name", value: channel.label },
              { label: "Username", value: handle },
              { label: "Display Name", value: channel.label },
              { label: "Category", value: "—" },
              {
                label: "Connected Since",
                value: formatDateTime(channel.last_connected_at ?? channel.created_at),
              },
            ]}
          />

          <ChannelConnectionCard
            channel={channel}
            lastSyncAt={lastSyncAt}
            onRefreshSync={onRefresh}
            showConnectedSince={false}
            extraItems={[{ label: "Last Updated", value: formatDateTime(channel.updated_at) }]}
          />

          <ChannelActivityCard channel={channel} kind="instagram" />

          {canManage ? (
            <ChannelAdvancedCard
              channel={channel}
              fields={[
                { label: "Business ID", value: channel.business_id ?? "—" },
                { label: "Account ID", value: channel.waba_id ?? channel.phone_number_id ?? "—" },
                { label: "Provider", value: channel.provider ?? "—" },
                { label: "Channel Type", value: channel.channel_type ?? "instagram" },
                { label: "Onboarding Status", value: channel.onboarding?.status ?? "—" },
                { label: "Created At", value: formatDateTime(channel.created_at) },
              ]}
            />
          ) : null}
        </>
      }
      sidebar={
        <div className="space-y-4">
          <ChannelReadyCard isReady={isReady} />

          {whatsappChannels.length > 0 ? (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Linked WhatsApp Channels</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Optionally link related WhatsApp numbers for cross-channel workflows.
              </p>
              <div className="mt-3 space-y-2">
                {whatsappChannels.slice(0, 3).map((wa) => (
                  <div
                    key={wa.id}
                    className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <ProviderIcon provider="whatsapp" className="h-4 w-4 text-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{wa.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {formatSecondaryIdentifier(wa, "whatsapp")}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled title="Coming soon">
                      Link
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <ChannelQuickActionsCard
            actions={[
              { href: "/inbox", icon: Inbox, label: "Go to Inbox" },
              { href: "/inbox", icon: Send, label: "Send Test Message" },
              { href: "/onboarding", icon: Workflow, label: "Manage Automation" },
              { href: "/team/users", icon: Users, label: "Add Team Access" },
              { href: "/broadcast/reports", icon: BarChart3, label: "View Analytics" },
            ]}
          />
          <ChannelNeedHelpCard />
        </div>
      }
    />
  );
}
