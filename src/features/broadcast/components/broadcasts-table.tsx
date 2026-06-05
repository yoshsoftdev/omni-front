"use client";

import { Button } from "@/components/ui/button";
import { broadcastService } from "@/features/broadcast/services/broadcast.service";
import { useAuthStore } from "@/store/auth-store";
import type { Broadcast } from "@/types/broadcast";

interface BroadcastsTableProps {
  broadcasts: Broadcast[];
  onChanged: () => void;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  sending: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  completed: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
  failed: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
  cancelled: "bg-muted text-muted-foreground",
};

export function BroadcastsTable({ broadcasts, onChanged }: BroadcastsTableProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";

  async function handleCancel(id: string) {
    await broadcastService.cancel(id);
    onChanged();
  }

  if (broadcasts.length === 0) {
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
            <th className="px-4 py-3 text-left font-medium">Recipients</th>
            <th className="px-4 py-3 text-left font-medium">Schedule</th>
            {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((broadcast) => (
            <tr key={broadcast.id} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{broadcast.name}</div>
                <div className="line-clamp-2 text-xs text-muted-foreground">{broadcast.message}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[broadcast.status] ?? ""}`}>
                  {broadcast.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {broadcast.sent_count}/{broadcast.total_recipients} sent
                {broadcast.failed_count > 0 ? `, ${broadcast.failed_count} failed` : ""}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {broadcast.scheduled_at
                  ? new Date(broadcast.scheduled_at).toLocaleString()
                  : "Immediate"}
              </td>
              {canManage ? (
                <td className="px-4 py-3 text-right">
                  {broadcast.status === "scheduled" ? (
                    <Button size="sm" variant="outline" onClick={() => handleCancel(broadcast.id)}>
                      Cancel
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
