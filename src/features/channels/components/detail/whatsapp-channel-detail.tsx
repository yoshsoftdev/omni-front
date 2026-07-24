"use client";

import {
  BarChart3,
  Briefcase,
  FileText,
  Inbox,
  Send,
  Users,
} from "lucide-react";

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
import { ChannelPaymentCard } from "@/features/channels/components/detail/channel-payment-card";
import type { ChannelHealthResult } from "@/features/channels/services/channel-health.service";
import type { ChannelPaymentStatusResult } from "@/features/channels/services/channel-payment.service";
import {
  formatBusinessVerificationLabel,
  isBusinessVerifiedStatus,
} from "@/features/channels/services/channel-payment.service";
import type { Channel } from "@/features/channels/types/channel";
import {
  connectionStatusLabel,
  formatConnectionMethod,
  formatSecondaryIdentifier,
} from "@/features/channels/utils/channel-display";

type WhatsAppChannelDetailProps = {
  channel: Channel;
  canManage: boolean;
  detailLoading: boolean;
  payment: ChannelPaymentStatusResult | null;
  paymentLoading: boolean;
  paymentOpening?: boolean;
  health: ChannelHealthResult | null;
  lastSyncAt?: string;
  showSyncSection: boolean;
  onShowSync: () => void;
  onRefresh: () => void;
  onRefreshPayment: () => void;
  onOpenPayment: () => void;
  onOpenMeta: () => void;
  onDelete: () => void;
};

export function WhatsAppChannelDetail({
  channel,
  canManage,
  detailLoading,
  payment,
  paymentLoading,
  paymentOpening = false,
  health,
  lastSyncAt,
  showSyncSection,
  onShowSync,
  onRefresh,
  onRefreshPayment,
  onOpenPayment,
  onOpenMeta,
  onDelete,
}: WhatsAppChannelDetailProps) {
  const paymentOk = payment?.status === "configured";
  const paymentRestricted = payment?.status === "restricted";
  const paymentUnavailable = payment?.status === "unavailable";
  const businessVerified = isBusinessVerifiedStatus(payment?.business_verification_status);
  const businessVerificationLabel = paymentLoading
    ? "Checking..."
    : formatBusinessVerificationLabel(payment?.business_verification_status);
  const isReady =
    channel.status === "connected" &&
    paymentOk &&
    businessVerified &&
    (health?.healthy ?? channel.status === "connected");

  const phoneActive = Boolean(health?.checks?.phone || channel.phone_number);

  let paymentMetricValue = "Checking...";
  if (!paymentLoading && payment) {
    if (payment.status === "configured") paymentMetricValue = "Payment OK";
    else if (payment.status === "restricted") paymentMetricValue = "Restricted";
    else if (payment.status === "unavailable") paymentMetricValue = "Unavailable";
    else paymentMetricValue = "Missing";
  }

  let incompleteMessage = "Lengkapi setup channel WhatsApp.";
  if (paymentRestricted) {
    incompleteMessage = payment.message;
  } else if (paymentUnavailable) {
    incompleteMessage = payment.message;
  } else if (!paymentOk) {
    incompleteMessage = payment?.message ?? "Metode pembayaran belum dikonfigurasi.";
  } else if (!businessVerified) {
    incompleteMessage = "Business verification belum verified di Meta Business Manager.";
  }

  return (
    <ChannelDetailShell
      main={
        <>
          <ChannelDetailHeader
            channel={channel}
            kind="whatsapp"
            secondaryLine={formatSecondaryIdentifier(channel, "whatsapp")}
            tertiaryLine={formatConnectionMethod(channel.connection_type)}
            openExternalLabel="Open in Meta"
            canManage={canManage}
            onReconnect={onShowSync}
            onOpenExternal={onOpenMeta}
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
                label: "Business",
                value: businessVerificationLabel,
                ok: businessVerified,
              },
              {
                label: "Phone Number",
                value: detailLoading ? "Checking..." : phoneActive ? "Active" : "Inactive",
                ok: phoneActive,
              },
              {
                label: "Payment",
                value: paymentMetricValue,
                ok: paymentOk,
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

          <ChannelPaymentCard
            result={payment}
            loading={paymentLoading}
            canManage={canManage}
            opening={paymentOpening}
            onOpenBilling={onOpenPayment}
            onOpenManager={onOpenMeta}
            onRefresh={onRefreshPayment}
          />

          <ChannelInfoGridCard
            title="Business Information"
            description="WABA payment uses WABA ID; business verification comes from Meta business_verification_status on that WABA."
            icon={<Briefcase className="h-4 w-4" />}
            items={[
              { label: "Business Name", value: channel.label },
              {
                label: "Business Verification",
                value: businessVerificationLabel,
                positive: businessVerified,
              },
              { label: "WABA ID", value: channel.waba_id ?? payment?.requested_waba_id ?? "—" },
              {
                label: "Business ID",
                value: channel.business_id ?? payment?.stored_business_id ?? payment?.owner_business_id ?? "—",
              },
            ]}
          />

          <ChannelConnectionCard channel={channel} lastSyncAt={lastSyncAt} onRefreshSync={onRefresh} />

          <ChannelActivityCard
            channel={channel}
            kind="whatsapp"
            paymentStatus={payment?.status === "configured" ? "configured" : payment ? "missing" : null}
          />

          {canManage ? <ChannelAdvancedCard channel={channel} /> : null}
        </>
      }
      sidebar={
        <div className="space-y-4">
          <ChannelReadyCard isReady={isReady} incompleteMessage={incompleteMessage} />
          <ChannelQuickActionsCard
            actions={[
              { href: "/inbox", icon: Inbox, label: "Go to Inbox" },
              { href: "/inbox", icon: Send, label: "Send Test Message" },
              { href: "/broadcast/templates", icon: FileText, label: "Manage Templates" },
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
