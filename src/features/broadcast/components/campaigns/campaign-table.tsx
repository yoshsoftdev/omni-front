"use client";

import Link from "next/link";
import { Eye, MoreHorizontal } from "lucide-react";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CampaignAudienceCell } from "@/features/broadcast/components/campaigns/campaign-audience-cell";
import type { Campaign } from "@/features/broadcast/types/campaign";
import {
  formatDeliveredProgress,
  formatScheduledAt,
  formatSentProgress,
  formatStatusLabel,
  formatTemplateDisplayName,
} from "@/features/broadcast/utils/campaign-list-format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<Campaign["status"], string> = {
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-info-muted text-info-foreground border-info-border",
  running: "bg-warning-muted text-warning-foreground border-warning-border",
  completed: "bg-success-muted text-success-foreground border-success-border",
  cancelled: "bg-error-muted text-error-foreground border-error-border",
  failed: "bg-error-muted text-error-foreground border-error-border",
};

function StatusBadge({ status }: { status: Campaign["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

interface CampaignTableProps {
  campaigns: Campaign[];
  emptyMessage?: string;
  onCancel?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onSend?: (campaign: Campaign) => void;
}

export function CampaignTable({ campaigns, emptyMessage = "No campaigns found.", onCancel, onDuplicate, onSend }: CampaignTableProps) {
  return (
    <DataTable>
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Campaign Name</DataTableHeaderCell>
          <DataTableHeaderCell>Audience</DataTableHeaderCell>
          <DataTableHeaderCell>Template</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>Scheduled At</DataTableHeaderCell>
          <DataTableHeaderCell>Sent</DataTableHeaderCell>
          <DataTableHeaderCell>Delivered</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        {campaigns.length === 0 ? (
          <DataTableEmpty message={emptyMessage} />
        ) : (
          campaigns.map((campaign) => {
            const recipientTotal =
              campaign.audience?.recipient_count ?? campaign.total_contacts ?? 0;
            return (
              <DataTableRow key={campaign.id}>
                <DataTableCell>
                  <div className="font-medium">{campaign.name}</div>
                  {campaign.description ? (
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {campaign.description}
                    </div>
                  ) : null}
                </DataTableCell>
                <DataTableCell>
                  <CampaignAudienceCell campaign={campaign} />
                </DataTableCell>
                <DataTableCell>
                  <div className="max-w-[180px]">
                    <div
                      className="truncate text-sm font-medium"
                      title={formatTemplateDisplayName(campaign.template_name)}
                    >
                      {formatTemplateDisplayName(campaign.template_name)}
                    </div>
                    {campaign.template_language ? (
                      <div className="text-xs text-muted-foreground">{campaign.template_language}</div>
                    ) : null}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge status={campaign.status} />
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">
                  {formatScheduledAt(campaign.scheduled_at)}
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">
                  {formatSentProgress(campaign.sent_count ?? 0, recipientTotal)}
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">
                  {formatDeliveredProgress(campaign.delivered_count ?? 0, campaign.sent_count ?? 0)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild aria-label={`View ${campaign.name}`}>
                      <Link href={`/broadcast/campaigns/${campaign.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`More actions for ${campaign.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {campaign.status === "draft" && onSend ? (
                          <DropdownMenuItem onSelect={() => onSend(campaign)}>Send Campaign</DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem asChild>
                          <Link href={`/broadcast/campaigns/${campaign.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        {onDuplicate ? (
                          <DropdownMenuItem onSelect={() => onDuplicate(campaign.id)}>Duplicate</DropdownMenuItem>
                        ) : null}
                        {(campaign.status === "scheduled" || campaign.status === "draft") && onCancel ? (
                          <DropdownMenuItem destructive onSelect={() => onCancel(campaign.id)}>Cancel</DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </DataTableCell>
              </DataTableRow>
            );
          })
        )}
      </DataTableBody>
    </DataTable>
  );
}

export { StatusBadge };
