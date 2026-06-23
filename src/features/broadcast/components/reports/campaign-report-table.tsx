"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/features/broadcast/components/campaigns/campaign-table";
import { calcCtr, calcPct } from "@/features/broadcast/utils/campaign-metrics";
import type { Campaign } from "@/features/broadcast/types/campaign";

export function CampaignReportTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <DataTable>
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Campaign</DataTableHeaderCell>
          <DataTableHeaderCell>Sent</DataTableHeaderCell>
          <DataTableHeaderCell>Delivered</DataTableHeaderCell>
          <DataTableHeaderCell>Read</DataTableHeaderCell>
          <DataTableHeaderCell>Failed</DataTableHeaderCell>
          <DataTableHeaderCell>Replies</DataTableHeaderCell>
          <DataTableHeaderCell>CTR</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        {campaigns.length === 0 ? (
          <DataTableEmpty message="No campaign reports yet." />
        ) : (
          campaigns.map((campaign) => (
            <DataTableRow key={campaign.id}>
              <DataTableCell>
                <div className="font-medium">{campaign.name}</div>
                <StatusBadge status={campaign.status} />
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">{campaign.sent_count.toLocaleString()}</DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {campaign.delivered_count.toLocaleString()}
                <div className="text-[10px]">{calcPct(campaign.delivered_count, campaign.sent_count)}</div>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {campaign.read_count.toLocaleString()}
                <div className="text-[10px]">{calcPct(campaign.read_count, campaign.sent_count)}</div>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {campaign.failed_count.toLocaleString()}
                <div className="text-[10px]">{calcPct(campaign.failed_count, campaign.sent_count)}</div>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">
                {campaign.reply_count.toLocaleString()}
                <div className="text-[10px]">{calcPct(campaign.reply_count, campaign.sent_count)}</div>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">{calcCtr(campaign).toFixed(1)}%</DataTableCell>
              <DataTableCell className="text-right">
                <Link
                  href={`/broadcast/reports/${campaign.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  title="View report"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}
