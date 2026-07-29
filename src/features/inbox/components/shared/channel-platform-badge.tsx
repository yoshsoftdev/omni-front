"use client";

import { ProviderIcon } from "@/components/shared/provider-badge";
import {
  channelTypeToProvider,
  platformShortCode,
} from "@/features/inbox/utils/channel-display";
import { cn } from "@/lib/utils";

interface ChannelPlatformBadgeProps {
  channelType?: string;
  className?: string;
}

/** Compact platform chip (icon + WA/IG/FB) — channel name stays primary elsewhere. */
export function ChannelPlatformBadge({ channelType, className }: ChannelPlatformBadgeProps) {
  const provider = channelTypeToProvider(channelType);
  const code = platformShortCode(channelType);

  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-[#E5E7EB] bg-[#F6F7F9] px-1.5 text-[10px] font-semibold tracking-wide text-[#6B7280] dark:border-border dark:bg-muted dark:text-muted-foreground",
        className,
      )}
      title={code}
      aria-hidden
    >
      <ProviderIcon provider={provider} className="h-3 w-3" />
      {code}
    </span>
  );
}
