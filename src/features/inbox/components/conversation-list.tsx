"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RefreshCw, Search } from "lucide-react";

import { ConversationCard } from "@/features/inbox/components/conversation-card";
import type { InboxConversation, InboxTab } from "@/features/inbox/types";
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
  channelFilter: string;
  channelUnreadCounts?: Record<string, number>;
  agentFilter: string;
  search: string;
  agents: { id: string; name: string }[];
  showAgentFilter?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onTabChange: (tab: InboxTab) => void;
  onChannelFilterChange: (value: string) => void;
  onAgentFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
}

const ROW_HEIGHT = 72;

export function ConversationList({
  conversations,
  selectedId,
  activeTab,
  tabCounts,
  channelFilter,
  channelUnreadCounts = {},
  agentFilter,
  search,
  agents,
  showAgentFilter = true,
  loading = false,
  hasMore = false,
  isFetchingNextPage = false,
  onTabChange,
  onChannelFilterChange,
  onAgentFilterChange,
  onSearchChange,
  onSelect,
  onRefresh,
  onLoadMore,
}: ConversationListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
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

  // If the first page does not fill the viewport, keep fetching
  // so users can immediately see more conversations.
  useEffect(() => {
    const element = parentRef.current;
    if (!element || !hasMore || isFetchingNextPage) return;
    if (element.scrollHeight <= element.clientHeight + ROW_HEIGHT) {
      onLoadMore();
    }
  }, [conversations.length, hasMore, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element || !hasMore || isFetchingNextPage) return;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < ROW_HEIGHT * 3) {
      onLoadMore();
    }
  }, [conversations.length, hasMore, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    if (!hasMore || isFetchingNextPage || conversations.length === 0) return;
    if (lastVirtualIndex >= conversations.length - 2) {
      onLoadMore();
    }
  }, [lastVirtualIndex, conversations.length, hasMore, isFetchingNextPage, onLoadMore]);

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-r bg-card">
      <div className="border-b px-3 pt-3">
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
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label} ({tabCounts[tab.id]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-3">
          <select
            value={channelFilter}
            onChange={(e) => onChannelFilterChange(e.target.value)}
            className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">All Channels ({channelUnreadCounts.all ?? 0})</option>
            <option value="whatsapp">WhatsApp ({channelUnreadCounts.whatsapp ?? 0})</option>
            <option value="instagram">Instagram ({channelUnreadCounts.instagram ?? 0})</option>
            <option value="messenger">Messenger ({channelUnreadCounts.messenger ?? 0})</option>
            <option value="email">Email ({channelUnreadCounts.email ?? 0})</option>
          </select>
          <select
            value={agentFilter}
            onChange={(e) => onAgentFilterChange(e.target.value)}
            className={cn("h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs", !showAgentFilter && "hidden")}
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative pb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="inbox-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
      >
        {loading && conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No conversations found.</p>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualItems.map((virtualRow) => {
              const conversation = conversations[virtualRow.index];
              if (!conversation) return null;
              return (
                <div
                  key={conversation.id}
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
                    onSelect={() => {
                      // Temporary debug to verify selected conversation channel mapping.
                      console.log("[Inbox] Conversation selected", {
                        id: conversation.id,
                        channel: conversation.channel,
                        contact_id: conversation.contact_id,
                      });
                      onSelect(conversation.id);
                    }}
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
