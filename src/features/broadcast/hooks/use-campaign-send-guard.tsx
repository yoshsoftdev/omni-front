"use client";

import { useCallback, useState } from "react";

import { PaymentRequiredDialog } from "@/features/broadcast/components/shared/payment-required-dialog";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { channelPaymentService } from "@/features/channels/services/channel-payment.service";
import { ApiClientError } from "@/services/api/errors";

export function useCampaignSendGuard(channelId?: string) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const openPaymentSetup = useCallback(async () => {
    if (!channelId) return;
    setPaymentLoading(true);
    try {
      const url = await channelPaymentService.createPaymentLink(channelId);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setPaymentLoading(false);
    }
  }, [channelId]);

  const sendCampaign = useCallback(
    async (campaignId: string, channelIdForPayment?: string) => {
      try {
        return await campaignService.send(campaignId);
      } catch (error) {
        if (error instanceof ApiClientError && error.code === "payment_required") {
          if (channelIdForPayment ?? channelId) {
            setPaymentDialogOpen(true);
          }
          throw error;
        }
        throw error;
      }
    },
    [channelId],
  );

  const paymentDialog = (
    <PaymentRequiredDialog
      open={paymentDialogOpen}
      loading={paymentLoading}
      onAddPayment={() => void openPaymentSetup()}
      onCancel={() => setPaymentDialogOpen(false)}
    />
  );

  return {
    sendCampaign,
    paymentDialog,
    paymentDialogOpen,
    setPaymentDialogOpen,
  };
}
