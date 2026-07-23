import { providerLabel } from "@/components/shared/provider-badge";
import type { Channel } from "@/features/channels/types/channel";

export type ProviderFilter = "all" | "whatsapp" | "instagram" | "messenger";
export type ChannelKind = "whatsapp" | "instagram" | "messenger";

export const FILTER_OPTIONS: { value: ProviderFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
];

export const GROUP_LABELS: Record<ChannelKind, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

export function getChannelKind(channel: Channel): ChannelKind {
  const type = (channel.channel_type ?? "").toLowerCase();
  if (type === "whatsapp") return "whatsapp";
  if (type === "instagram") return "instagram";
  const provider = (channel.provider ?? "").toLowerCase();
  if (type === "messenger" || provider.includes("messenger")) return "messenger";
  if (channel.waba_id || channel.phone_number_id) return "whatsapp";
  return "messenger";
}

export function formatSecondaryIdentifier(channel: Channel, kind: ChannelKind): string {
  if (kind === "whatsapp") {
    return channel.phone_number ?? channel.phone_number_id ?? channel.waba_id ?? "—";
  }
  if (kind === "instagram") {
    const handle = channel.phone_number ?? channel.waba_id;
    if (!handle) return "—";
    return handle.startsWith("@") ? handle : `@${handle}`;
  }
  return channel.phone_number ?? channel.business_id ?? channel.waba_id ?? "—";
}

export function formatConnectionMethod(connectionType?: string) {
  const v = (connectionType ?? "").trim();
  if (v === "embedded_coex") return "Embedded Signup (CoEx)";
  if (v === "manual") return "Manual Setup";
  return v || "—";
}

export function formatDateTime(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function formatRelativeSync(raw?: string): string {
  if (!raw) return "Never";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Never";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return d.toLocaleString();
}

export function kindLabel(kind: ChannelKind): string {
  if (kind === "messenger") return "Messenger";
  return providerLabel(kind);
}

export function providerIconTone(_kind: ChannelKind): { wrap: string; icon: string } {
  return {
    wrap: "bg-muted",
    icon: "text-foreground",
  };
}

export function connectionStatusLabel(status: Channel["status"]): string {
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";
  return "Disconnected";
}
