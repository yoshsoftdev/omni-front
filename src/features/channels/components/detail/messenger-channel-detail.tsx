"use client";

import { BarChart3, Briefcase, Inbox, Send, Users, Workflow } from "lucide-react";

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

type MessengerChannelDetailProps = {
  channel: Channel;
  canManage: boolean;
  detailLoading: boolean;
  lastSyncAt?: string;
  showSyncSection: boolean;
  onShowSync: () => void;
  onRefresh: () => void;
  onDelete: () => void;
};

export function MessengerChannelDetail({
  channel,
  canManage,
  detailLoading,
  lastSyncAt,
  showSyncSection,
  onShowSync,
  onRefresh,
  onDelete,
}: MessengerChannelDetailProps) {
  const isReady = channel.status === "connected";
  const pageId = channel.business_id ?? channel.phone_number ?? channel.waba_id;
  const secondary = formatSecondaryIdentifier(channel, "messenger");

  function openFacebook() {
    if (!pageId) return;
    window.open(`https://www.facebook.com/${pageId}`, "_blank", "noopener,noreferrer");
  }

  return (
    <ChannelDetailShell
      main={
        <>
          <ChannelDetailHeader
            channel={channel}
            kind="messenger"
            secondaryLine={secondary}
            tertiaryLine="Facebook Messenger"
            openExternalLabel="Open in Facebook"
            canManage={canManage}
            onReconnect={onShowSync}
            onOpenExternal={openFacebook}
            openExternalDisabled={!pageId}
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
                label: "Facebook Page",
                value: detailLoading ? "Checking..." : channel.status === "connected" ? "Linked" : "—",
                ok: channel.status === "connected",
              },
              {
                label: "Messenger",
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
            title="Page Information"
            description="Facebook Page linked for Messenger conversations."
            icon={<Briefcase className="h-4 w-4" />}
            items={[
              { label: "Page Name", value: channel.label },
              { label: "Page ID", value: pageId ?? "—" },
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

          <ChannelActivityCard channel={channel} kind="messenger" />

          {canManage ? (
            <ChannelAdvancedCard
              channel={channel}
              fields={[
                { label: "Page ID", value: pageId ?? "—" },
                { label: "Business ID", value: channel.business_id ?? "—" },
                { label: "Provider", value: channel.provider ?? "—" },
                { label: "Channel Type", value: channel.channel_type ?? "messenger" },
                { label: "Onboarding Status", value: channel.onboarding?.status ?? "—" },
                { label: "Created At", value: formatDateTime(channel.created_at) },
              ]}
            />
          ) : null}
        </>
      }
      sidebar={
        <div className="space-y-4">
          <ChannelReadyCard
            isReady={isReady}
            readyMessage="Your Facebook Messenger channel is ready to receive conversations."
            incompleteMessage="Reconnect the Facebook Page to finish Messenger setup."
          />
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
