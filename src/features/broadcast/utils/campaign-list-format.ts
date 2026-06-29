import type { CampaignStatus } from "@/features/broadcast/types/campaign";

export type CampaignAudienceType = "segment" | "tag" | "manual" | "mixed" | "";

export type CampaignAudienceSource = {
  type: string;
  id: string;
  name: string;
};

export type CampaignAudience = {
  type: CampaignAudienceType;
  name: string;
  recipient_count: number;
  snapshot: boolean;
  snapshot_at?: string;
  extra_audiences?: number;
  sources?: CampaignAudienceSource[];
};

export function recipientCountLabel(count: number): string {
  const safe = Math.max(0, count ?? 0);
  const formatted = safe.toLocaleString();
  return safe === 1 ? `${formatted} recipient` : `${formatted} recipients`;
}

export function audienceCountPrefix(status: CampaignStatus, snapshot: boolean): string | null {
  if (status === "draft" && !snapshot) {
    return "Estimated";
  }
  if (snapshot) {
    return "Snapshot";
  }
  if (status === "running" || status === "completed") {
    return status === "running" ? "Sending to" : "Sent to";
  }
  return null;
}

export function formatTemplateDisplayName(name?: string): string {
  if (!name?.trim()) {
    return "—";
  }
  return name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatStatusLabel(status: CampaignStatus): string {
  if (status === "running") {
    return "Sending";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatScheduledAt(iso?: string): string {
  if (!iso) {
    return "Not scheduled";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) {
    return `Today ${time}`;
  }
  if (isTomorrow) {
    return `Tomorrow ${time}`;
  }
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** @deprecated Use formatScheduledAt */
export const formatSchedule = formatScheduledAt;

export function formatSentProgress(sent: number, total: number): string {
  const safeSent = Math.max(0, sent ?? 0);
  const safeTotal = Math.max(0, total ?? 0);
  if (safeTotal <= 0) {
    return safeSent.toLocaleString();
  }
  return `${safeSent.toLocaleString()} / ${safeTotal.toLocaleString()}`;
}

export function formatDeliveredProgress(delivered: number, sent: number): string {
  const safeDelivered = Math.max(0, delivered ?? 0);
  const safeSent = Math.max(0, sent ?? 0);
  if (safeSent <= 0) {
    return safeDelivered.toLocaleString();
  }
  const pct = Math.round((safeDelivered / safeSent) * 100);
  return `${safeDelivered.toLocaleString()} (${pct}%)`;
}

export function audienceTypeLabel(type: CampaignAudienceType): string {
  switch (type) {
    case "segment":
      return "Segment";
    case "tag":
      return "Tag";
    case "manual":
      return "Manual";
    case "mixed":
      return "Mixed";
    default:
      return "";
  }
}
