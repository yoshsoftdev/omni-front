import type { ChannelHealthResult } from "@/features/channels/services/channel-health.service";
import {
  isBusinessVerifiedStatus,
  type ChannelPaymentStatusResult,
} from "@/features/channels/services/channel-payment.service";
import type { Channel } from "@/features/channels/types/channel";

/** One requirement for a channel to send messages. `ok` is null while it is still being checked. */
export interface ReadinessItem {
  key: string;
  label: string;
  ok: boolean | null;
  /** What to do when it is not ok. */
  hint: string;
}

/** Every requirement a WhatsApp channel must meet to send, in the order to fix them. */
export function whatsappReadiness(input: {
  channel: Pick<Channel, "status">;
  payment: ChannelPaymentStatusResult | null;
  health: ChannelHealthResult | null;
}): ReadinessItem[] {
  const { channel, payment, health } = input;
  const checks = health?.checks;
  const check = (value: boolean | undefined) => (health ? Boolean(value) : null);
  return [
    {
      key: "connection",
      label: "Connected",
      ok: channel.status === "connected",
      hint: "Reconnect the channel.",
    },
    {
      key: "token",
      label: "Access token valid",
      ok: check(checks?.token),
      hint: "The Meta access token is invalid or expired. Reconnect the channel.",
    },
    {
      key: "phone",
      label: "Phone number registered",
      ok: check(checks?.phone),
      hint: "Register the phone number for the Cloud API in Meta Business Manager.",
    },
    {
      key: "business",
      label: "Business verified",
      ok: payment ? isBusinessVerifiedStatus(payment.business_verification_status) : null,
      hint: "Verify the business in Meta Business Manager.",
    },
    {
      key: "payment",
      label: "Payment method",
      ok: payment ? payment.status === "configured" : null,
      hint: payment?.message || "Add a payment method for this WhatsApp account in Meta.",
    },
    {
      key: "templates",
      label: "Templates synced",
      ok: check(checks?.template_sync ?? checks?.templates_api),
      hint: "Sync message templates from Broadcast → Templates.",
    },
  ];
}

/** Ready only when every requirement is known to be met. */
export function isReady(items: ReadinessItem[]): boolean {
  return items.every((item) => item.ok === true);
}
