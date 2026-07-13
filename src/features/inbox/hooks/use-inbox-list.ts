"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { inboxListQueryKey } from "@/features/inbox/query-keys";
import {
  inboxFilterKey,
  inboxService,
  inboxTabToParams,
  type InboxListParams,
} from "@/features/inbox/services/inbox.service";
import type { ConversationDelta } from "@/features/inbox/lib/inbox-delta";
import { useInboxCacheStore } from "@/features/inbox/store/inbox-cache-store";
import type { InboxTab } from "@/features/inbox/types";

interface UseInboxListOptions {
  tab: InboxTab;
  channelFilter: string;
  agentFilter: string;
  search: string;
  currentUserId?: string;
  enabled?: boolean;
}

export function useInboxList({
  tab,
  channelFilter,
  agentFilter,
  search,
  currentUserId,
  enabled = true,
}: UseInboxListOptions) {
  const params = useMemo(
    () =>
      inboxTabToParams(tab, {
        channelId: channelFilter,
        assignedTo: agentFilter,
        search,
        currentUserId,
      }),
    [tab, channelFilter, agentFilter, search, currentUserId],
  );
  const filterKey = inboxFilterKey(params);

  const reset = useInboxCacheStore((state) => state.reset);
  const applyDelta = useInboxCacheStore((state) => state.applyDelta);
  const bucket = useInboxCacheStore((state) => state.caches[filterKey]);

  const conversations = useMemo(
    () => {
      const orderedIds = bucket?.orderedIds ?? [];
      const byId = bucket?.byId ?? {};
      return orderedIds.map((id) => byId[id]).filter(Boolean);
    },
    [bucket],
  );
  const hasMore = bucket?.hasMore ?? false;
  const nextCursor = bucket?.nextCursor ?? null;

  const query = useInfiniteQuery({
    queryKey: inboxListQueryKey(filterKey),
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const request: InboxListParams = { ...params };
      if (pageParam) request.cursor = pageParam;
      return inboxService.list(request);
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data?.pages.length) return;
    const merged = query.data.pages.flatMap((page) => page.conversations);
    const lastPage = query.data.pages[query.data.pages.length - 1];
    reset(filterKey, merged, lastPage.nextCursor, lastPage.hasMore);
  }, [query.dataUpdatedAt, filterKey, reset, query.data]);

  const refresh = async () => {
    await query.refetch();
  };

  const fetchNextPage = () => {
    if ((!hasMore && !query.hasNextPage) || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  };

  const loading = query.isLoading || (conversations.length === 0 && query.isFetching);

  return {
    filterKey,
    conversations,
    loading,
    error: query.error instanceof Error ? query.error.message : null,
    hasMore: hasMore || Boolean(query.hasNextPage),
    nextCursor,
    fetchNextPage,
    refresh,
    isFetchingNextPage: query.isFetchingNextPage,
    applyListDelta: (delta: ConversationDelta) => applyDelta(filterKey, delta),
  };
}
