import type { ProviderKind } from "@/types/contact";

/** Short platform chip label for channel-account rows (WA, IG, FB, …). */
export function platformShortCode(channelType?: string): string {
  const normalized = (channelType ?? "").toLowerCase();
  if (normalized === "whatsapp" || normalized === "meta" || normalized === "meta_whatsapp") return "WA";
  if (normalized === "instagram" || normalized === "ig") return "IG";
  if (normalized === "messenger" || normalized === "facebook" || normalized === "fb") return "FB";
  if (normalized === "telegram" || normalized === "tg") return "TG";
  if (normalized === "email") return "EM";
  if (!normalized) return "?";
  return normalized.slice(0, 2).toUpperCase();
}

export function channelTypeToProvider(channelType?: string): ProviderKind {
  const normalized = (channelType ?? "").toLowerCase();
  if (normalized === "instagram" || normalized === "ig") return "instagram";
  if (normalized === "messenger" || normalized === "facebook" || normalized === "fb") return "messenger";
  if (normalized === "telegram" || normalized === "tg") return "telegram";
  if (normalized === "email") return "email";
  return "whatsapp";
}
