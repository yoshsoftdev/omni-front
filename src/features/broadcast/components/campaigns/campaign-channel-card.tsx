"use client";

import { DeviceStatusBadge } from "@/features/devices/components/device-status-badge";
import type { Channel } from "@/features/channels/types/channel";
import { cn } from "@/lib/utils";

interface CampaignChannelCardProps {
  channel: Channel;
  selected: boolean;
  onSelect: () => void;
}

function formatProvider(provider: string): string {
  if (provider === "meta") return "Meta WhatsApp";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function CampaignChannelCard({ channel, selected, onSelect }: CampaignChannelCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        selected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 p-4 text-left">
        <input type="radio" readOnly checked={selected} className="mt-1" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{channel.label}</span>
            <DeviceStatusBadge status={channel.status} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {channel.phone_number ?? "No number linked"} · {formatProvider(channel.provider)}
          </div>
          {channel.waba_id ? (
            <p className="mt-2 text-xs text-muted-foreground">WABA: {channel.waba_id}</p>
          ) : null}
        </div>
      </button>
    </div>
  );
}
