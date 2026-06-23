import type { Campaign } from "@/features/broadcast/types/campaign";

export function calcCtr(campaign: Campaign): number {
  if (campaign.delivered_count <= 0) return 0;
  return (campaign.clicked_count / campaign.delivered_count) * 100;
}

export function calcPct(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}
