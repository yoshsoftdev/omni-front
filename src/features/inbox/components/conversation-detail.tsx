"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AUTOMATION_AGENT_PICK_ID, AssignConversationModal } from "@/features/inbox/components/assign-conversation-modal";
import { ConversationHeader } from "@/features/inbox/components/conversation-header";
import { MessageComposer, type ComposerSendInput } from "@/features/inbox/components/message-composer";
import { MessageList } from "@/features/inbox/components/messages/message-list";
import { useInboxAgents } from "@/features/inbox/hooks/use-inbox-agents";
import { useFreeTextWindow } from "@/features/inbox/hooks/use-free-text-window";
import { mapConversationToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { quickReplyService } from "@/features/settings/services/quick-reply.service";
import { webhookService } from "@/features/automation/services/webhook.service";
import type {
  InboxActivityEvent,
  InboxChatMessage,
  InboxConversation,
} from "@/features/inbox/types";

interface ConversationDetailProps {
  conversation: InboxConversation | null;
  channelLabel?: string;
  messages: InboxChatMessage[];
  activities?: InboxActivityEvent[];
  presenceLabel?: string | null;
  onSendMessage: (input: ComposerSendInput) => void;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onRetryMessage: (clientMessageId: string) => void;
  onConversationUpdate: (conversation: InboxConversation) => void;
  onSaveNote: (content: string) => void;
  onAddTag?: () => void;
  onBack?: () => void;
  onOpenContext?: () => void;
  onNotify: (message: string, type?: "success" | "error") => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function ConversationDetail({
  conversation,
  channelLabel,
  messages,
  activities = [],
  presenceLabel,
  onSendMessage,
  onDeleteMessage,
  onRetryMessage,
  onConversationUpdate,
  onSaveNote,
  onAddTag,
  onBack,
  onOpenContext,
  onNotify,
  onTypingStart,
  onTypingStop,
}: ConversationDetailProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const { agents } = useInboxAgents();
  const [replyToMessage, setReplyToMessage] = useState<InboxChatMessage | null>(null);
  const [automationAgentEnabled, setAutomationAgentEnabled] = useState(false);

  const { data: quickReplies = [] } = useQuery({
    queryKey: ["quick-replies"],
    queryFn: () => quickReplyService.list(),
    staleTime: 60_000,
  });

  const quickReplyItems = useMemo(
    () =>
      quickReplies.map((item) => ({
        id: item.id,
        category: item.category,
        text: item.content,
      })),
    [quickReplies],
  );

  useEffect(() => {
    webhookService
      .getInboxAutomationSettings()
      .then((settings) => setAutomationAgentEnabled(Boolean(settings.enabled && settings.hasWebhook)))
      .catch(() => setAutomationAgentEnabled(false));
  }, []);

  const handleAssign = useCallback(
    async (agentId: string) => {
      if (!conversation) return;
      try {
        const isAutomation = agentId === AUTOMATION_AGENT_PICK_ID;
        const updated = await conversationService.assign(conversation.id, isAutomation ? null : agentId);
        const agent = agents.find((a) => a.id === agentId);
        const mapped = mapConversationToInbox(updated);
        onConversationUpdate({
          ...mapped,
          // Automation keeps conversation OPEN + unassigned to human agent.
          status: isAutomation ? "open" : mapped.status,
          assigned_to: isAutomation ? undefined : mapped.assigned_to,
          assignee_name: isAutomation ? "Automation Agent" : agent?.name ?? updated.assignee_name,
        });
        setAssignOpen(false);
        if (isAutomation) {
          onNotify("Routed to Automation Agent (status Open)");
        } else {
          onNotify(agent ? `Assigned to ${agent.name}` : "Conversation assigned");
        }
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
        await onDeleteMessage(message.id);
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

  const freeTextWindow = useFreeTextWindow(
    conversation?.channel,
    conversation?.last_customer_message_at,
    messages,
  );

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#F6F7F9] text-sm text-[#6B7280] dark:bg-muted/10">
        Select a conversation to open the workspace.
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <ConversationHeader
        conversation={conversation}
        channelLabel={channelLabel}
        presenceLabel={presenceLabel}
        onAssignClick={() => setAssignOpen(true)}
        onTagClick={onAddTag}
        onMoreAction={handleMoreAction}
        onBack={onBack}
        onOpenContext={onOpenContext}
      />
      <MessageList
        key={conversation.id}
        messages={messages}
        channel={conversation.channel}
        activities={activities}
        onReply={setReplyToMessage}
        onDelete={handleDelete}
        onRetry={onRetryMessage}
      />
      <MessageComposer
        channel={conversation.channel}
        channelLabel={channelLabel}
        quickReplies={quickReplyItems}
        quickReplyContext={{
          customer_name: conversation.customer_name || conversation.contact_name,
          phone: conversation.contact_phone,
        }}
        replyTo={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
        onSend={onSendMessage}
        onSaveNote={onSaveNote}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        freeTextAllowed={freeTextWindow.allowed}
      />

      <AssignConversationModal
        open={assignOpen}
        agents={agents}
        enableAutomationAgent={automationAgentEnabled}
        selectedAgentId={conversation.assigned_to}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />
    </div>
  );
}
