"use client";

import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  loading,
  search,
  onSearchChange,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="border-b p-3">
        <h2 className="mb-2 text-sm font-semibold">Conversations</h2>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name or phone..."
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full flex-col gap-1 border-b px-3 py-3 text-left transition-colors hover:bg-accent/50",
                selectedId === conversation.id && "bg-accent",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{conversation.contact_name}</span>
                {conversation.unread_count > 0 ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {conversation.unread_count}
                  </span>
                ) : null}
              </div>
              <span className="truncate text-xs text-muted-foreground">{conversation.contact_phone}</span>
              {conversation.last_message_preview ? (
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {conversation.last_message_preview}
                </span>
              ) : null}
              {conversation.assignee_name ? (
                <span className="text-xs text-muted-foreground">Assigned: {conversation.assignee_name}</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
