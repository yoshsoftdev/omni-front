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
import { ColorDot } from "@/components/shared/color-dot";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/features/broadcast/types/campaign";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<Campaign["status"], string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  running: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

function StatusBadge({ status }: { status: Campaign["status"] }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

function formatSchedule(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CampaignTableProps {
  campaigns: Campaign[];
  onCancel?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function CampaignTable({ campaigns, onCancel, onDuplicate }: CampaignTableProps) {
  return (
    <DataTable>
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Campaign Name</DataTableHeaderCell>
          <DataTableHeaderCell>Audience (Segment)</DataTableHeaderCell>
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
          <DataTableEmpty message="No campaigns found." />
        ) : (
          campaigns.map((campaign) => (
            <DataTableRow key={campaign.id}>
              <DataTableCell>
                <div className="font-medium">{campaign.name}</div>
                {campaign.description ? (
                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{campaign.description}</div>
                ) : null}
              </DataTableCell>
              <DataTableCell>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <ColorDot color="#10B981" className="h-2 w-2" />
                  {campaign.segment_name}
                </span>
              </DataTableCell>
              <DataTableCell>
                <code className="text-xs">{campaign.template_name}</code>
              </DataTableCell>
              <DataTableCell>
                <StatusBadge status={campaign.status} />
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatSchedule(campaign.scheduled_at)}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{campaign.sent_count.toLocaleString()}</DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {campaign.delivered_count.toLocaleString()}
                {campaign.sent_count > 0 ? (
                  <span className="ml-1 text-[10px]">
                    ({((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)}%)
                  </span>
                ) : null}
              </DataTableCell>
              <DataTableCell className="text-right">
                <div className="inline-flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild title="View">
                    <Link href={`/broadcast/campaigns/${campaign.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="relative">
                    <select
                      className="absolute inset-0 cursor-pointer opacity-0"
                      defaultValue=""
                      onChange={(e) => {
                        const action = e.target.value;
                        e.target.value = "";
                        if (action === "edit") window.location.href = `/broadcast/campaigns/${campaign.id}`;
                        if (action === "duplicate" && onDuplicate) onDuplicate(campaign.id);
                        if (action === "cancel" && onCancel) onCancel(campaign.id);
                      }}
                    >
                      <option value="" disabled>More</option>
                      <option value="edit">Edit</option>
                      <option value="duplicate">Duplicate</option>
                      {campaign.status === "scheduled" || campaign.status === "draft" ? (
                        <option value="cancel">Cancel</option>
                      ) : null}
                    </select>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}

export { StatusBadge, formatSchedule };
