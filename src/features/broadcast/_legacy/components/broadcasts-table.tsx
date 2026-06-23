"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { useAuthStore } from "@/store/auth-store";
import type { Campaign } from "@/features/broadcast/types/campaign";

interface BroadcastsTableProps {
  campaigns: Campaign[];
  onChanged: () => void;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  running: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  completed: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
  failed: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
  cancelled: "bg-muted text-muted-foreground",
};

export function BroadcastsTable({ campaigns, onChanged }: BroadcastsTableProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      await campaignService.send(id);
      onChanged();
    } finally {
      setSendingId(null);
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No campaigns yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Campaign</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Report</th>
            <th className="px-4 py-3 text-left font-medium">Schedule</th>
            {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{campaign.name}</div>
                <div className="text-xs text-muted-foreground">Template campaign</div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[campaign.status] ?? ""}`}
                >
                  {campaign.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                <div>
                  {campaign.sent_count}/{campaign.total_contacts} sent
                </div>
                <div className="text-muted-foreground">
                  {campaign.delivered_count} delivered · {campaign.read_count} read · {campaign.failed_count} failed
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {campaign.scheduled_at
                  ? new Date(campaign.scheduled_at).toLocaleString()
                  : "Immediate"}
              </td>
              {canManage ? (
                <td className="px-4 py-3 text-right">
                  {campaign.status === "draft" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sendingId === campaign.id}
                      onClick={() => handleSend(campaign.id)}
                    >
                      {sendingId === campaign.id ? "Sending..." : "Send"}
                    </Button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
