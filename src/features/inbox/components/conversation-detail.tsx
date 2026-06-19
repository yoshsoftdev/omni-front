"use client";

import { useCallback, useState } from "react";

import { AssignConversationModal } from "@/features/inbox/components/assign-conversation-modal";
import { ConversationHeader } from "@/features/inbox/components/conversation-header";
import { MessageComposer } from "@/features/inbox/components/message-composer";
import { MessageThread } from "@/features/inbox/components/message-bubble";
import { MOCK_AGENTS, MOCK_QUICK_REPLIES } from "@/features/inbox/mock-data";
import type { InboxChatMessage, InboxConversation } from "@/features/inbox/types";

interface ConversationDetailProps {
  conversation: InboxConversation | null;
  messages: InboxChatMessage[];
  onMessagesChange: (messages: InboxChatMessage[]) => void;
  onConversationUpdate: (conversation: InboxConversation) => void;
  onSaveNote: (content: string) => void;
  onNotify: (message: string) => void;
}

export function ConversationDetail({
  conversation,
  messages,
  onMessagesChange,
  onConversationUpdate,
  onSaveNote,
  onNotify,
}: ConversationDetailProps) {
  const [assignOpen, setAssignOpen] = useState(false);

  const handleSend = useCallback(
    (content: string) => {
      if (!conversation) return;
      const newMessage: InboxChatMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: conversation.id,
        direction: "outbound",
        type: "text",
        content,
        sent_at: new Date().toISOString(),
        delivered: true,
        read: false,
        sender_name: "You",
      };
      onMessagesChange([...messages, newMessage]);
      onConversationUpdate({
        ...conversation,
        last_message_preview: content,
        last_message_at: newMessage.sent_at,
        unread_count: 0,
      });
      onNotify("Message sent");
    },
    [conversation, messages, onConversationUpdate, onMessagesChange, onNotify],
  );

  const handleAssign = useCallback(
    (agentId: string) => {
      if (!conversation) return;
      const agent = MOCK_AGENTS.find((a) => a.id === agentId);
      onConversationUpdate({
        ...conversation,
        assigned_to: agentId,
        assignee_name: agent?.name,
        status: "assigned",
      });
      setAssignOpen(false);
      onNotify(`Assigned to ${agent?.name}`);
    },
    [conversation, onConversationUpdate, onNotify],
  );

  const handleMoreAction = useCallback(
    (action: string) => {
      if (!conversation) return;
      if (action === "close") {
        onConversationUpdate({ ...conversation, status: "closed" });
        onNotify("Conversation closed");
      } else if (action === "reopen") {
        onConversationUpdate({ ...conversation, status: "open" });
        onNotify("Conversation reopened");
      } else if (action === "mark_unread") {
        onConversationUpdate({ ...conversation, unread_count: conversation.unread_count + 1 });
        onNotify("Marked as unread");
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
      <MessageThread messages={messages} />
      <MessageComposer
        quickReplies={MOCK_QUICK_REPLIES}
        onSend={handleSend}
        onSaveNote={onSaveNote}
      />

      <AssignConversationModal
        open={assignOpen}
        agents={MOCK_AGENTS}
        selectedAgentId={conversation.assigned_to}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />
    </div>
  );
}
