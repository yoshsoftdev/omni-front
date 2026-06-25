import { cn } from "@/lib/utils";
import type { ChannelStatus } from "@/features/channels/types/channel";

const labels: Record<ChannelStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
};

const styles: Record<ChannelStatus, string> = {
  disconnected: "bg-muted text-muted-foreground",
  connecting: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  connected: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
};

export function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
