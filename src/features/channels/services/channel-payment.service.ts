import { apiClient } from "@/services/api/client";

export type ChannelPaymentStatus = "configured" | "missing" | "restricted";

export type ChannelPaymentStatusResult = {
  status: ChannelPaymentStatus;
  message: string;
  waba_status?: string;
  has_primary_funding: boolean;
  primary_funding_id?: string;
};

export const PAYMENT_MESSAGE_MISSING = "Metode pembayaran belum dikonfigurasi.";
export const PAYMENT_MESSAGE_OK = "Payment OK";
export const PAYMENT_MESSAGE_RESTRICTED =
  "Akun WhatsApp Business sedang dibatasi oleh Meta. Silakan buka WhatsApp Manager untuk melihat dan menyelesaikan masalah.";

export const channelPaymentService = {
  async getStatus(channelId: string): Promise<ChannelPaymentStatusResult> {
    const response = await apiClient.get<ChannelPaymentStatusResult>(
      `/channels/${channelId}/payment-status`,
    );
    const data = response.data!;
    return {
      status: data.status,
      message: data.message || fallbackMessage(data.status),
      waba_status: data.waba_status,
      has_primary_funding: Boolean(data.has_primary_funding),
      primary_funding_id: data.primary_funding_id,
    };
  },

  async createPaymentLink(channelId: string) {
    const response = await apiClient.post<{ url: string }>(`/channels/${channelId}/payment-link`, {});
    return response.data!.url;
  },
};

function fallbackMessage(status: ChannelPaymentStatus): string {
  if (status === "configured") return PAYMENT_MESSAGE_OK;
  if (status === "restricted") return PAYMENT_MESSAGE_RESTRICTED;
  return PAYMENT_MESSAGE_MISSING;
}
