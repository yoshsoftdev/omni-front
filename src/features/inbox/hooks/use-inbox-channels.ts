"use client";

import { useQuery } from "@tanstack/react-query";

import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { inboxChannelsQueryKey } from "@/features/inbox/query-keys";
import type { InboxChannelNavItem } from "@/features/inbox/types";

export function useInboxChannels(unreadByChannelId: Record<string, number> = {}) {
  const query = useQuery({
    queryKey: inboxChannelsQueryKey,
    queryFn: () => channelQueryService.getChannels(),
    staleTime: 60_000,
  });

  const channels: InboxChannelNavItem[] = (query.data ?? []).map((channel) => ({
    id: channel.id,
    label: channel.label,
    channel_type: channel.channel_type,
    status: channel.status,
    unread_count: unreadByChannelId[channel.id] ?? 0,
  }));

  return {
    channels,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => query.refetch(),
  };
}
