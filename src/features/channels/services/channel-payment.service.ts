import { apiClient } from "@/services/api/client";

export type ChannelPaymentStatus = "configured" | "missing" | "restricted" | "unavailable";

export type ChannelPaymentStatusResult = {
  status: ChannelPaymentStatus;
  message: string;
  waba_status?: string;
  business_verification_status?: string;
  has_primary_funding: boolean;
  primary_funding_id?: string;
  funding_check_error?: string;
  check_source?: string;
  health_can_send_message?: string;
  health_payment_error_code?: number;
  health_payment_error?: string;
  requested_waba_id?: string;
  stored_business_id?: string;
  meta_object_id?: string;
  owner_business_id?: string;
};

export const PAYMENT_MESSAGE_MISSING = "Metode pembayaran belum dikonfigurasi.";
export const PAYMENT_MESSAGE_OK = "Payment OK";
export const PAYMENT_MESSAGE_RESTRICTED =
  "Akun WhatsApp Business sedang dibatasi oleh Meta. Silakan buka WhatsApp Manager untuk melihat dan menyelesaikan masalah.";
export const PAYMENT_MESSAGE_UNAVAILABLE =
  "Tidak dapat memastikan status pembayaran dari Meta saat ini. Coba refresh atau buka Meta Billing.";

export function isBusinessVerifiedStatus(status?: string | null): boolean {
  return String(status ?? "").trim().toLowerCase() === "verified";
}

export function formatBusinessVerificationLabel(status?: string | null): string {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  if (raw.toLowerCase() === "verified") return "Verified";
  if (raw.toLowerCase() === "not_verified") return "Not verified";
  return raw.replaceAll("_", " ");
}

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
      business_verification_status: data.business_verification_status,
      has_primary_funding: Boolean(data.has_primary_funding),
      primary_funding_id: data.primary_funding_id,
      funding_check_error: data.funding_check_error,
      check_source: data.check_source,
      health_can_send_message: data.health_can_send_message,
      health_payment_error_code: data.health_payment_error_code,
      health_payment_error: data.health_payment_error,
      requested_waba_id: data.requested_waba_id,
      stored_business_id: data.stored_business_id,
      meta_object_id: data.meta_object_id,
      owner_business_id: data.owner_business_id,
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
  if (status === "unavailable") return PAYMENT_MESSAGE_UNAVAILABLE;
  return PAYMENT_MESSAGE_MISSING;
}
