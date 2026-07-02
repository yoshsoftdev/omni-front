"use client";

import { RefreshCw, Search } from "lucide-react";

import { PaginationFooter } from "@/components/shared/pagination-footer";
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
  agentFilter: string;
  search: string;
  page: number;
  pageSize: number;
  agents: { id: string; name: string }[];
  showAgentFilter?: boolean;
  onTabChange: (tab: InboxTab) => void;
  onChannelFilterChange: (value: string) => void;
  onAgentFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function ConversationList({
  conversations,
  selectedId,
  activeTab,
  tabCounts,
  channelFilter,
  agentFilter,
  search,
  page,
  pageSize,
  agents,
  showAgentFilter = true,
  onTabChange,
  onChannelFilterChange,
  onAgentFilterChange,
  onSearchChange,
  onSelect,
  onPageChange,
  onRefresh,
}: ConversationListProps) {
  const totalPages = Math.max(1, Math.ceil(conversations.length / pageSize));
  const start = conversations.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, conversations.length);
  const pageItems = conversations.slice((page - 1) * pageSize, page * pageSize);

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
            <option value="all">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="messenger">Messenger</option>
            <option value="email">Email</option>
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {pageItems.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No conversations found.</p>
        ) : (
          pageItems.map((conversation, index) => (
            <ConversationCard
              key={conversation.id || `conversation-${index}`}
              conversation={conversation}
              selected={selectedId === conversation.id}
              onSelect={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>

      <PaginationFooter
        start={start}
        end={end}
        total={conversations.length}
        totalLabel="conversations"
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
