"use client";

import { useCallback, useEffect, useState } from "react";

import { AssignConversationModal } from "@/features/inbox/components/assign-conversation-modal";
import { ConversationHeader } from "@/features/inbox/components/conversation-header";
import { MessageComposer, type ComposerSendInput } from "@/features/inbox/components/message-composer";
import { MessageThread } from "@/features/inbox/components/message-bubble";
import { mapConversationToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { teamService } from "@/features/team/services/team.service";
import type { InboxAgent, InboxChatMessage, InboxConversation } from "@/features/inbox/types";

interface ConversationDetailProps {
  conversation: InboxConversation | null;
  messages: InboxChatMessage[];
  onSendMessage: (input: ComposerSendInput) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onConversationUpdate: (conversation: InboxConversation) => void;
  onSaveNote: (content: string) => void;
  onNotify: (message: string, type?: "success" | "error") => void;
}

export function ConversationDetail({
  conversation,
  messages,
  onSendMessage,
  onDeleteMessage,
  onConversationUpdate,
  onSaveNote,
  onNotify,
}: ConversationDetailProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [agents, setAgents] = useState<InboxAgent[]>([]);
  const [sending, setSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<InboxChatMessage | null>(null);

  useEffect(() => {
    teamService
      .listMembers()
      .then((members) =>
        setAgents(
          members.map((member) => ({
            id: member.user_id,
            name: member.name,
            email: member.email,
            presence: member.status === "active" ? "online" : "offline",
          })),
        ),
      )
      .catch(() => setAgents([]));
  }, []);

  const handleSend = useCallback(
    async (input: ComposerSendInput) => {
      if (!conversation || sending) return;
      setSending(true);
      try {
        // #region agent log
        fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
          body: JSON.stringify({
            sessionId: "d8bb7a",
            runId: "run1",
            hypothesisId: "H3",
            location: "conversation-detail.tsx:handleSend:before",
            message: "Composer send invoked",
            data: {
              conversationId: conversation.id,
              replyToMessageId: input.replyToMessageId ?? null,
              hasStorageObject: Boolean(input.storageObjectId),
              contentLength: input.content?.length ?? 0,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        await onSendMessage(input);
        // #region agent log
        fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
          body: JSON.stringify({
            sessionId: "d8bb7a",
            runId: "run1",
            hypothesisId: "H3",
            location: "conversation-detail.tsx:handleSend:after",
            message: "Composer send resolved",
            data: { conversationId: conversation.id },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        onNotify("Message sent");
        setReplyToMessage(null);
      } catch (err) {
        onNotify(err instanceof Error ? err.message : "Failed to send message", "error");
      } finally {
        setSending(false);
      }
    },
    [conversation, onNotify, onSendMessage, sending],
  );

  const handleAssign = useCallback(
    async (agentId: string) => {
      if (!conversation) return;
      try {
        const updated = await conversationService.assign(conversation.id, agentId);
        const agent = agents.find((a) => a.id === agentId);
        onConversationUpdate({
          ...mapConversationToInbox(updated),
          assignee_name: agent?.name ?? updated.assignee_name,
        });
        setAssignOpen(false);
        onNotify(agent ? `Assigned to ${agent.name}` : "Conversation assigned");
      } catch (err) {
        onNotify(err instanceof Error ? err.message : "Failed to assign conversation", "error");
      }
    },
    [agents, conversation, onConversationUpdate, onNotify],
  );

  const handleDelete = useCallback(
    async (message: InboxChatMessage) => {
      if (!conversation || message.is_deleted) return;
      try {
        // #region agent log
        fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
          body: JSON.stringify({
            sessionId: "d8bb7a",
            runId: "run1",
            hypothesisId: "H4",
            location: "conversation-detail.tsx:handleDelete:before",
            message: "Delete message invoked",
            data: { conversationId: conversation.id, messageId: message.id, wamid: message.wamid ?? null },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        await onDeleteMessage(message.id);
        // #region agent log
        fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
          body: JSON.stringify({
            sessionId: "d8bb7a",
            runId: "run1",
            hypothesisId: "H4",
            location: "conversation-detail.tsx:handleDelete:after",
            message: "Delete message resolved",
            data: { conversationId: conversation.id, messageId: message.id },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        onNotify("Message deleted");
      } catch (err) {
        onNotify(err instanceof Error ? err.message : "Failed to delete message", "error");
      }
    },
    [conversation, onDeleteMessage, onNotify],
  );

  const handleMoreAction = useCallback(
    async (action: string) => {
      if (!conversation) return;
      try {
        if (action === "close") {
          const updated = await conversationService.updateStatus(conversation.id, "closed");
          onConversationUpdate(mapConversationToInbox(updated));
          onNotify("Conversation closed");
        } else if (action === "reopen") {
          const updated = await conversationService.updateStatus(conversation.id, "open");
          onConversationUpdate(mapConversationToInbox(updated));
          onNotify("Conversation reopened");
        } else if (action === "mark_unread") {
          onConversationUpdate({ ...conversation, unread_count: conversation.unread_count + 1 });
          onNotify("Marked as unread");
        }
      } catch (err) {
        onNotify(err instanceof Error ? err.message : "Action failed", "error");
      }
    },
    [conversation, onConversationUpdate, onNotify],
  );

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
        Select a conversation to view messages.
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <ConversationHeader
        conversation={conversation}
        onAssignClick={() => setAssignOpen(true)}
        onMoreAction={handleMoreAction}
      />
      <MessageThread messages={messages} onReply={setReplyToMessage} onDelete={handleDelete} />
      <MessageComposer
        quickReplies={[]}
        sending={sending}
        replyTo={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
        onSend={handleSend}
        onSaveNote={onSaveNote}
      />

      <AssignConversationModal
        open={assignOpen}
        agents={agents}
        selectedAgentId={conversation.assigned_to}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />
    </div>
  );
}
