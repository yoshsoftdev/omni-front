"use client";

import Link from "next/link";

import { ChannelPlatformBadge } from "@/features/inbox/components/shared/channel-platform-badge";
import type { InboxChannelNavItem } from "@/features/inbox/types";
import { cn } from "@/lib/utils";

interface ChannelSidebarProps {
  channels: InboxChannelNavItem[];
  activeChannelId: string;
  allUnreadCount?: number;
  loading?: boolean;
  onSelect: (channelId: string) => void;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#111111] px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-foreground dark:text-background">
      {label}
    </span>
  );
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  allUnreadCount = 0,
  loading = false,
  onSelect,
}: ChannelSidebarProps) {
  const isAll = activeChannelId === "all";

  return (
    <nav className="flex h-full flex-col" aria-label="Inbox channels">
      <div className="border-b border-[#E5E7EB] px-3 py-3 dark:border-border">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Inbox</p>
      </div>

      <div className="border-b border-[#E5E7EB] p-2 dark:border-border">
        <button
          type="button"
          onClick={() => onSelect("all")}
          aria-current={isAll ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
            isAll
              ? "bg-[#111111] text-white dark:bg-foreground dark:text-background"
              : "text-[#111111] hover:bg-[#F6F7F9] dark:text-foreground dark:hover:bg-muted",
          )}
        >
          <span className="font-medium">All Inbox</span>
          <UnreadBadge count={allUnreadCount} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <p className="px-2.5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Channels
        </p>

        {loading && channels.length === 0 ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-lg bg-[#F6F7F9] dark:bg-muted" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="space-y-2 px-2.5 py-3 text-xs text-[#6B7280]">
            <p>No channels connected.</p>
            <Link href="/devices" className="font-medium text-[#2563EB] underline-offset-2 hover:underline">
              Connect a channel
            </Link>
          </div>
        ) : (
          <ul className="space-y-0.5" role="list">
            {channels.map((channel) => {
              const active = activeChannelId === channel.id;
              return (
                <li key={channel.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(channel.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                      active
                        ? "bg-[#111111] text-white dark:bg-foreground dark:text-background"
                        : "text-[#111111] hover:bg-[#F6F7F9] dark:text-foreground dark:hover:bg-muted",
                      channel.status !== "connected" && !active && "opacity-70",
                    )}
                  >
                    <ChannelPlatformBadge
                      channelType={channel.channel_type}
                      className={cn(active && "border-white/20 bg-white/10 text-white")}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{channel.label}</span>
                    <UnreadBadge count={channel.unread_count} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
