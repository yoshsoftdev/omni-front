"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RefreshCw, Search } from "lucide-react";

import { ConversationCard } from "@/features/inbox/components/conversation-card";
import type { InboxChannelNavItem, InboxConversation, InboxTab } from "@/features/inbox/types";
import {
  sortConversations,
  type ConversationListSort,
} from "@/features/inbox/utils/sort-conversations";
import { cn } from "@/lib/utils";

const TABS: { id: InboxTab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "assigned", label: "Assigned" },
  { id: "unassigned", label: "Unassigned" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

interface ConversationListProps {
  conversations: InboxConversation[];
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

/** Initial estimate only — real row heights are measured because cards wrap. */
const ROW_HEIGHT = 104;

export function ConversationList({
  conversations,
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
  const [sort, setSort] = useState<ConversationListSort>("recent");

  const channelLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const channel of channels) {
      map.set(channel.id, channel.label);
    }
    return map;
  }, [channels]);

  const sortedConversations = useMemo(
    () => sortConversations(conversations, sort),
    [conversations, sort],
  );

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
      <div className="border-b border-[#E5E7EB] px-3 pt-3 dark:border-border">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[#111111] text-white dark:bg-foreground dark:text-background"
                  : "text-[#6B7280] hover:bg-[#F6F7F9] dark:hover:bg-muted",
              )}
            >
              {tab.label} ({tabCounts[tab.id]})
            </button>
          ))}
        </div>

        <div className="pb-2 lg:hidden">
          <select
            value={activeChannelId}
            onChange={(e) => onChannelSelect(e.target.value)}
            className="h-8 w-full rounded-md border border-[#E5E7EB] bg-white px-2 text-xs dark:border-border dark:bg-background"
            aria-label="Channel account"
          >
            <option value="all">All Inbox</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.label}
                {channel.unread_count > 0 ? ` (${channel.unread_count})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pb-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ConversationListSort)}
            className="h-8 min-w-0 flex-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-xs dark:border-border dark:bg-background"
            aria-label="Sort conversations"
          >
            <option value="recent">Sort: Recent</option>
            <option value="waiting">Sort: Waiting longest</option>
          </select>
          <select
            value={agentFilter}
            onChange={(e) => onAgentFilterChange(e.target.value)}
            className={cn(
              "h-8 min-w-0 flex-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-xs dark:border-border dark:bg-background",
              !showAgentFilter && "hidden",
            )}
            disabled={!showAgentFilter}
            aria-hidden={!showAgentFilter}
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F6F7F9] dark:border-border dark:hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative pb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
          <input
            id="inbox-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-8 pr-3 text-sm dark:border-border dark:bg-background"
          />
        </div>
      </div>

      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="inbox-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
      >
        {loading && sortedConversations.length === 0 ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg bg-[#F6F7F9] dark:bg-muted" />
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          <p className="p-4 text-sm text-[#6B7280]">{emptyMessage}</p>
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
          <p className="p-3 text-center text-xs text-[#6B7280]">Loading more...</p>
        ) : null}
      </div>
    </div>
  );
}
