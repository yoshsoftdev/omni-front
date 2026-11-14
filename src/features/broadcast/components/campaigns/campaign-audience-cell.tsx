"use client";

import type { Campaign, CampaignAudience } from "@/features/broadcast/types/campaign";
import {
  audienceCountPrefix,
  audienceTypeLabel,
  recipientCountLabel,
} from "@/features/broadcast/utils/campaign-list-format";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<NonNullable<CampaignAudience["type"]>, string> = {
  segment: "border-info-border bg-info-muted text-info-foreground",
  tag: "border-violet-200 bg-violet-50 text-violet-700",
  manual: "border-warning-border bg-warning-muted text-warning-foreground",
  mixed: "border-border bg-muted text-muted-foreground",
  "": "border-border bg-muted text-muted-foreground",
};

type CampaignAudienceCellProps = {
  campaign: Campaign;
};

export function CampaignAudienceCell({ campaign }: CampaignAudienceCellProps) {
  const audience = campaign.audience;
  if (!audience?.name) {
    return <span className="text-sm text-muted-foreground">No audience selected</span>;
  }

  const countPrefix = audienceCountPrefix(campaign.status, audience.snapshot);
  const tooltipLines = [
    audience.name,
    ...(audience.sources ?? [])
      .slice(1)
      .map((source) => source.name)
      .filter(Boolean),
  ];

  return (
    <div
      className="min-w-[160px] max-w-[220px] space-y-1"
      title={tooltipLines.length > 1 ? tooltipLines.join("\n") : audience.name}
    >
      {audience.type ? (
        <span
          className={cn(
            "inline-flex rounded border px-1.5 py-0.5 text-xs font-medium",
            BADGE_STYLES[audience.type] ?? BADGE_STYLES[""],
          )}
        >
          {audienceTypeLabel(audience.type)}
        </span>
      ) : null}

      <div className="truncate text-sm font-medium text-foreground" title={audience.name}>
        {audience.name}
        {audience.extra_audiences && audience.extra_audiences > 0 ? (
          <span className="text-muted-foreground">{` +${audience.extra_audiences} audiences`}</span>
        ) : null}
      </div>

      <div className="text-xs text-muted-foreground">
        {countPrefix ? <span>{countPrefix} </span> : null}
        <span>{recipientCountLabel(audience.recipient_count ?? campaign.total_contacts ?? 0)}</span>
      </div>

      {audience.snapshot ? (
        <div className="text-xs text-muted-foreground">
          Snapshot
          {audience.snapshot_at
            ? ` · ${new Date(audience.snapshot_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : ""}
        </div>
      ) : null}
    </div>
  );
}
