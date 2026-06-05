"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import { useInboxRealtime } from "@/features/inbox/hooks/use-inbox-realtime";
import { conversationService } from "@/features/inbox/services/conversation.service";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";

function upsertConversation(list: Conversation[], incoming: Conversation) {
  const index = list.findIndex((item) => item.id === incoming.id);
  if (index === -1) {
    return [incoming, ...list];
  }
  const next = [...list];
  next[index] = { ...next[index], ...incoming };
  return next.sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<Message | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const loadConversations = useCallback(async () => {
    setError(null);
    try {
      const data = await conversationService.list({
        search: search.trim() || undefined,
      });
      setConversations(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadConversations();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  const patchConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => upsertConversation(prev, conversation));
  }, []);

  const realtimeHandlers = useMemo(
    () => ({
      onConversationUpdated: (conversation: Conversation) => {
        setConversations((prev) => upsertConversation(prev, conversation));
      },
      onMessageCreated: (message: Message) => {
        if (message.conversation_id === selectedIdRef.current) {
          setLiveMessage(message);
        }
      },
    }),
    [],
  );

  useInboxRealtime(realtimeHandlers);

  return (
    <div className="flex h-full min-h-0">
      <div className="w-full max-w-sm shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onSelect={setSelectedId}
        />
      </div>

      <div className="min-w-0 flex-1">
        {error ? (
          <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
        ) : null}
        <ConversationDetail
          conversation={selectedConversation}
          liveMessage={liveMessage}
          onConversationPatched={patchConversation}
        />
      </div>
    </div>
  );
}
