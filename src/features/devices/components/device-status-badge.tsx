import { cn } from "@/lib/utils";
import type { DeviceStatus } from "@/types/device";

const labels: Record<DeviceStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
};

const styles: Record<DeviceStatus, string> = {
  disconnected: "bg-muted text-muted-foreground",
  connecting: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  connected: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
};

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
