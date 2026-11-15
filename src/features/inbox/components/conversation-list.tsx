"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RefreshCw, Search } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationCard } from "@/features/inbox/components/conversation-card";
import type { InboxChannelNavItem, InboxConversation, InboxTab } from "@/features/inbox/types";
import type { ConversationListSort } from "@/features/inbox/utils/sort-conversations";
import { cn } from "@/lib/utils";

const TABS: { id: InboxTab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "assigned", label: "Assigned" },
  { id: "unassigned", label: "Unassigned" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

interface ConversationListProps {
  /** Already sorted by `sort`; the page owns the order so keyboard navigation matches it. */
  conversations: InboxConversation[];
  sort: ConversationListSort;
  onSortChange: (sort: ConversationListSort) => void;
  error?: string | null;
  selectedId: string | null;
  activeTab: InboxTab;
  tabCounts: Record<InboxTab, number>;
  /** Active channel account id (`all` or channel uuid). */
  activeChannelId: string;
  channels?: InboxChannelNavItem[];
  agentFilter: string;
  search: string;
  agents: { id: string; name: string }[];
  showAgentFilter?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onTabChange: (tab: InboxTab) => void;
  onChannelSelect: (channelId: string) => void;
  onAgentFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
}

const COMPACT_SELECT = "h-8 min-w-0 w-full flex-1 px-2 text-xs";

/** Initial estimate only — real row heights are measured because cards wrap. */
const ROW_HEIGHT = 104;

export function ConversationList({
  conversations: sortedConversations,
  sort,
  onSortChange,
  error,
  selectedId,
  activeTab,
  tabCounts,
  activeChannelId,
  channels = [],
  agentFilter,
  search,
  agents,
  showAgentFilter = true,
  loading = false,
  hasMore = false,
  isFetchingNextPage = false,
  onTabChange,
  onChannelSelect,
  onAgentFilterChange,
  onSearchChange,
  onSelect,
  onRefresh,
  onLoadMore,
}: ConversationListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const channelLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const channel of channels) {
      map.set(channel.id, channel.label);
    }
    return map;
  }, [channels]);

  const activeChannelLabel =
    activeChannelId !== "all"
      ? channelLabelById.get(activeChannelId)
      : undefined;

  const virtualizer = useVirtualizer({
    count: sortedConversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => sortedConversations[index]?.id ?? index,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastVirtualIndex = useMemo(
    () => (virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1),
    [virtualItems],
  );

  const handleScroll = useCallback(() => {
    const element = parentRef.current;
    if (!element || !hasMore || isFetchingNextPage) return;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < ROW_HEIGHT * 3) {
      onLoadMore();
    }
  }, [hasMore, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element || !hasMore || isFetchingNextPage) return;
    if (element.scrollHeight <= element.clientHeight + ROW_HEIGHT) {
      onLoadMore();
    }
  }, [sortedConversations.length, hasMore, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    if (!hasMore || isFetchingNextPage || sortedConversations.length === 0) return;
    if (lastVirtualIndex >= sortedConversations.length - 2) {
      onLoadMore();
    }
  }, [lastVirtualIndex, sortedConversations.length, hasMore, isFetchingNextPage, onLoadMore]);

  const emptyMessage = activeChannelLabel
    ? `No conversations in ${activeChannelLabel}.`
    : "No conversations found.";

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-card">
      <div className="border-b border-border px-3 pt-3">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background dark:hover:bg-muted",
              )}
            >
              {tab.label} ({tabCounts[tab.id]})
            </button>
          ))}
        </div>

        <div className="pb-2 lg:hidden">
          <FilterSelect
            label="Channel account"
            value={activeChannelId}
            onChange={onChannelSelect}
            options={[
              { value: "all", label: "All Inbox" },
              ...channels.map((channel) => ({
                value: channel.id,
                label: channel.unread_count > 0 ? `${channel.label} (${channel.unread_count})` : channel.label,
              })),
            ]}
            className={COMPACT_SELECT}
          />
        </div>

        <div className="flex items-center gap-2 pb-3">
          <FilterSelect
            label="Sort conversations"
            value={sort}
            onChange={(value) => onSortChange(value as ConversationListSort)}
            options={[
              { value: "recent", label: "Sort: Recent" },
              { value: "waiting", label: "Sort: Waiting longest" },
            ]}
            className={COMPACT_SELECT}
          />
          {showAgentFilter ? (
            <FilterSelect
              label="Filter by agent"
              value={agentFilter}
              onChange={onAgentFilterChange}
              options={[
                { value: "all", label: "All Agents" },
                ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
              ]}
              className={COMPACT_SELECT}
            />
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border hover:bg-background dark:hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative pb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="inbox-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm dark:bg-background"
          />
        </div>
      </div>

      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="inbox-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
      >
        {error && sortedConversations.length === 0 ? (
          <ErrorState message={error} onRetry={onRefresh} className="m-3 p-6" />
        ) : loading && sortedConversations.length === 0 ? (
          <div className="space-y-2 p-3" aria-busy="true" aria-label="Loading conversations">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          <EmptyState message={emptyMessage} className="m-3 p-6" />
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualItems.map((virtualRow) => {
              const conversation = sortedConversations[virtualRow.index];
              if (!conversation) return null;
              return (
                <div
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ConversationCard
                    conversation={conversation}
                    selected={selectedId === conversation.id}
                    onSelect={() => onSelect(conversation.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
        {isFetchingNextPage ? (
          <p className="p-3 text-center text-xs text-muted-foreground">Loading more...</p>
        ) : null}
      </div>
    </div>
  );
}
