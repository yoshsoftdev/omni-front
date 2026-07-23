import { StatusBadge } from "@/components/shared/status-badge";
import type { ChannelStatus } from "@/features/channels/types/channel";

const labels: Record<ChannelStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
};

export function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  if (status === "connected") {
    return <StatusBadge tone="success">{labels[status]}</StatusBadge>;
  }
  if (status === "connecting") {
    return <StatusBadge tone="warning">{labels[status]}</StatusBadge>;
  }
  return <StatusBadge tone="neutral">{labels[status]}</StatusBadge>;
}
