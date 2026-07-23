"use client";

import { CreditCard, RefreshCw } from "lucide-react";

import { Alert } from "@/components/shared/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { DetailCard, InfoCell } from "@/features/channels/components/detail/channel-detail-primitives";
import type {
  ChannelPaymentStatus,
  ChannelPaymentStatusResult,
} from "@/features/channels/services/channel-payment.service";
import { cn } from "@/lib/utils";

type ChannelPaymentCardProps = {
  result: ChannelPaymentStatusResult | null;
  loading: boolean;
  canManage: boolean;
  onOpenBilling: () => void;
  onOpenManager: () => void;
  onRefresh: () => void;
  opening?: boolean;
};

export function ChannelPaymentCard({
  result,
  loading,
  canManage,
  onOpenBilling,
  onOpenManager,
  onRefresh,
  opening = false,
}: ChannelPaymentCardProps) {
  const checking = loading || result === null;
  const status = result?.status ?? null;
  const configured = status === "configured";
  const restricted = status === "restricted";

  return (
    <DetailCard
      title="Payment"
      description="Checked against Meta WABA primary_funding_id and status."
      icon={<CreditCard className="h-4 w-4" />}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={loading || opening}
            aria-label="Refresh payment status"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          {canManage && restricted ? (
            <Button type="button" size="sm" onClick={onOpenManager} disabled={loading || opening}>
              Buka WhatsApp Manager
            </Button>
          ) : null}
          {canManage && !restricted ? (
            <Button type="button" size="sm" onClick={onOpenBilling} disabled={loading || opening}>
              {opening ? "Membuka..." : configured ? "Open Meta Billing" : "Tambah Metode Pembayaran"}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCell
          label="Status"
          value={
            checking
              ? "Checking..."
              : configured
                ? "Payment OK"
                : restricted
                  ? "Restricted"
                  : "Belum dikonfigurasi"
          }
          tone={configured ? "success" : restricted ? "error" : checking ? "neutral" : "warning"}
        />
        <InfoCell
          label="primary_funding_id"
          value={
            checking
              ? "Checking..."
              : result?.has_primary_funding
                ? result.primary_funding_id || "Terisi"
                : "null"
          }
        />
        <InfoCell label="WABA Status" value={checking ? "Checking..." : result?.waba_status || "—"} />
        <InfoCell
          label="Payment Method"
          value={
            checking
              ? "Checking..."
              : configured
                ? "Configured in Meta"
                : restricted
                  ? "Akun dibatasi"
                  : "Not Configured"
          }
        />
      </div>

      {!checking && result?.message ? (
        <div className="mt-4">
          {configured ? (
            <Alert variant="success">{result.message}</Alert>
          ) : restricted ? (
            <Alert variant="error" title="Akun dibatasi">
              {result.message}
            </Alert>
          ) : (
            <Alert variant="warning" title="Setup Incomplete">
              {result.message}
            </Alert>
          )}
        </div>
      ) : null}
    </DetailCard>
  );
}

export function PaymentStatusBadge({
  status,
}: {
  status: ChannelPaymentStatus | null | "loading";
}) {
  if (status === "loading" || status === null) {
    return <StatusBadge tone="neutral">Payment…</StatusBadge>;
  }
  if (status === "configured") {
    return <StatusBadge tone="success">Payment OK</StatusBadge>;
  }
  if (status === "restricted") {
    return <StatusBadge tone="error">Restricted</StatusBadge>;
  }
  return <StatusBadge tone="warning">No payment</StatusBadge>;
}
