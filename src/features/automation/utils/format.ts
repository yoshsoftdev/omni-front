import type { StatusBadgeTone } from "@/components/shared/status-badge";

/**
 * Public Automation invoke base — webhook-service only (backend is internal).
 * Prefer NEXT_PUBLIC_WEBHOOK_URL; fall back to absolute API host for local docs.
 */
const PUBLIC_INVOKE_BASE =
  process.env.NEXT_PUBLIC_WEBHOOK_URL ??
  process.env.NEXT_PUBLIC_AUTOMATION_API_URL ??
  "https://webhook.omnichan.app/api/v1";

/** Public invoke URL — always id-based, never slug-based. Served by webhook-service. */
export function endpointInvokeUrl(endpointId: string): string {
  const base = PUBLIC_INVOKE_BASE.replace(/\/$/, "");
  return `${base}/automation/endpoints/${endpointId}`;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "—";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function successRateTone(rate: number): StatusBadgeTone {
  if (rate >= 98) return "success";
  if (rate >= 90) return "warning";
  return "error";
}

export function maskApiKey(prefix: string): string {
  if (prefix.includes("•")) return prefix;
  const short = prefix.replace(/^oc_auto_/, "");
  return `oc_auto_••••••••${short.slice(-4)}`;
}
