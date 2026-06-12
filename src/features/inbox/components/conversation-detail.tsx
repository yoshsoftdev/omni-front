"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { inboxUnreadCountQueryKey } from "@/features/inbox/query-keys";
import { MessageComposer } from "@/features/inbox/components/message-composer";
import { MessageThread } from "@/features/inbox/components/message-thread";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { messageService } from "@/features/inbox/services/message.service";
import { teamService } from "@/features/team/services/team.service";
import { dedupeMessages, mergeMessages } from "@/features/inbox/utils/messages";
import type { Conversation, ConversationStatus } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { TeamMember } from "@/types/team";

interface ConversationDetailProps {
  conversation: Conversation | null;
  liveMessage: Message | null;
  onConversationPatched: (conversation: Conversation) => void;
}

export function ConversationDetail({
  conversation,
  liveMessage,
  onConversationPatched,
}: ConversationDetailProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const markedReadRef = useRef<string | null>(null);
  const processedLiveIdsRef = useRef<Set<string>>(new Set());

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const data = await messageService.list(conversationId);
      setMessages(dedupeMessages(data));
    } finally {
      setLoading(false);
    }
  }, []);

  const markReadOnce = useCallback(async (conversationId: string) => {
    if (markedReadRef.current === conversationId) return;
    markedReadRef.current = conversationId;
    try {
      const updated = await conversationService.markRead(conversationId);
      onConversationPatched(updated);
      void queryClient.invalidateQueries({ queryKey: inboxUnreadCountQueryKey });
    } catch {
      markedReadRef.current = null;
    }
  }, [onConversationPatched, queryClient]);

  useEffect(() => {
    teamService.listMembers().then(setMembers).catch(() => setMembers([]));
  }, []);

  const conversationId = conversation?.id ?? null;

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      markedReadRef.current = null;
      processedLiveIdsRef.current.clear();
      return;
    }

    void loadMessages(conversationId);
    void markReadOnce(conversationId);
  }, [conversationId, loadMessages, markReadOnce]);

  useEffect(() => {
    if (!liveMessage || !conversationId || liveMessage.conversation_id !== conversationId) {
      return;
    }
    if (processedLiveIdsRef.current.has(liveMessage.id)) return;
    processedLiveIdsRef.current.add(liveMessage.id);
    setMessages((prev) => mergeMessages(prev, liveMessage));
  }, [liveMessage, conversationId]);

  async function handleAssign(userId: string) {
    if (!conversation) return;
    const updated = await conversationService.assign(conversation.id, userId || null);
    onConversationPatched(updated);
  }

  async function handleStatus(status: ConversationStatus) {
    if (!conversation) return;
    const updated = await conversationService.updateStatus(conversation.id, status);
    onConversationPatched(updated);
  }

  async function handleSend(content: string) {
    if (!conversation) return;
    const message = await messageService.send(conversation.id, content);
    setMessages((prev) => mergeMessages(prev, message));
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
        Select a conversation to view messages.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div>
          <h2 className="font-semibold">{conversation.contact_name}</h2>
          <p className="text-xs text-muted-foreground">{conversation.contact_phone}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={conversation.assigned_to ?? ""}
            onChange={(e) => handleAssign(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name || member.email}
              </option>
            ))}
          </select>

          <Button size="sm" variant="outline" onClick={() => handleStatus("open")}>
            Open
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStatus("pending")}>
            Pending
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStatus("resolved")}>
            Resolve
          </Button>
        </div>
      </div>

      <MessageThread messages={messages} loading={loading} />
      <MessageComposer onSend={handleSend} />
    </div>
  );
}
