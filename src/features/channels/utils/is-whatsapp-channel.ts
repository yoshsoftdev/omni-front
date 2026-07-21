import type { Channel } from "@/features/channels/types/channel";

const WHATSAPP_PROVIDERS = new Set(["meta", "meta_whatsapp", "whatsapp"]);

/**
 * Templates / WABA sync only apply to WhatsApp Business channels.
 * Instagram (and other providers) must be excluded from template management.
 */
export function isWhatsAppChannel(channel: Channel): boolean {
  const channelType = channel.channel_type?.trim().toLowerCase();
  if (channelType === "whatsapp") return true;
  if (channelType === "instagram") return false;

  const provider = channel.provider.trim().toLowerCase();
  if (provider.includes("instagram") || provider === "ig") return false;
  return WHATSAPP_PROVIDERS.has(provider) || Boolean(channel.waba_id || channel.phone_number_id);
}
