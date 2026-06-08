import type { CampaignStatus } from "@/types/broadcast";

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  draft: "DRAFT",
  scheduled: "TERJADWAL",
  queued: "BERJALAN",
  sending: "BERJALAN",
  completed: "SELESAI",
  failed: "GAGAL",
  cancelled: "DIBATALKAN",
};

export const scheduleTabs = [
  { value: "all", label: "Semua" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "running", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
] as const;

export function matchesScheduleTab(status: CampaignStatus, tab: string): boolean {
  if (tab === "all") return true;
  if (tab === "scheduled") return status === "scheduled";
  if (tab === "running") return status === "queued" || status === "sending";
  if (tab === "completed") return status === "completed";
  if (tab === "cancelled") return status === "cancelled" || status === "failed";
  return true;
}
