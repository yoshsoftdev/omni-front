"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CONTACTS_UPDATED_EVENT, contactService } from "@/features/contacts/services/contact.service";
import { ChannelSidebar } from "@/features/inbox/components/channel-sidebar/channel-sidebar";
import { ContactSidebar } from "@/features/inbox/components/contact-sidebar";
import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import type { ComposerSendInput } from "@/features/inbox/components/message-composer";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import {
  InboxLayout,
  type InboxMobilePane,
} from "@/features/inbox/components/layout/inbox-layout";
import { useInboxAgents } from "@/features/inbox/hooks/use-inbox-agents";
import { useInboxChannels } from "@/features/inbox/hooks/use-inbox-channels";
import { useInboxList } from "@/features/inbox/hooks/use-inbox-list";
import { useConversationPresence } from "@/features/inbox/hooks/use-conversation-presence";
import { useInboxRealtime } from "@/features/inbox/hooks/use-inbox-realtime";
import { useInboxRealtimeCache } from "@/features/inbox/hooks/use-inbox-realtime-cache";
import { useInboxSelection } from "@/features/inbox/hooks/use-inbox-selection";
import { useInboxUnreadCount } from "@/features/inbox/hooks/use-inbox-unread-count";
import { useIsNarrowViewport } from "@/features/inbox/hooks/use-is-narrow-viewport";
import {
  applyMessageStatusUpdate,
  markMessageFailed,
  markMessageSending,
  reconcileApiMessage,
  upsertOptimisticMessage,
} from "@/features/inbox/lib/message-reconcile";
import { mapContactToInboxContact, mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { contentTypeFromMime, normalizeMessage } from "@/features/inbox/mappers/message.mapper";
import { inboxUnreadCountQueryKey } from "@/features/inbox/query-keys";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { messageService } from "@/features/inbox/services/message.service";
import { computeInboxTabCounts } from "@/features/inbox/utils/conversation-filters";
import { applyMessageDateLabels } from "@/features/inbox/utils/message-date";
import { withResolvedAssignee } from "@/features/inbox/utils/resolve-assignee";
import { generateUUID } from "@/lib/uuid";
import type {
  InboxActivityEvent,
  InboxChannel,
  InboxChatMessage,
  InboxContact,
  InboxConversation,
  InboxTab,
  InboxWorkspaceNote,
} from "@/features/inbox/types";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";
import { useAuthStore } from "@/store/auth-store";
import type { ConsentStatus } from "@/types/contact";
import type { Message } from "@/types/message";

function toMillis(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function optimisticAttachmentPreview(input: ComposerSendInput): string {
  if (input.content.trim()) return input.content.trim();
  const mimeType = input.attachment?.mime_type ?? "";
  const type = mimeType ? contentTypeFromMime(mimeType) : "text";
  switch (type) {
    case "audio":
      return "Voice note";
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "document":
      return input.attachment?.filename || "Document";
    default:
      return "Media";
  }
}

function sortMessagesAsc(messages: InboxChatMessage[]) {
  return [...messages].sort((a, b) => toMillis(a.sent_at) - toMillis(b.sent_at));
}

const CHANNEL_NOTIFY_PREFIX: Partial<Record<InboxChannel, string>> = {
  whatsapp: "🟢 WhatsApp",
  instagram: "🟣 Instagram",
  messenger: "🔵 Messenger",
  email: "⚪ Email",
};

export function InboxPage() {
  const queryClient = useQueryClient();
  const {
    channelId,
    selectedId,
    contactParam,
    setChannelId,
    setSelectedId,
    replaceParams,
  } = useInboxSelection();
  const agentName = useAuthStore((state) => state.user?.name ?? "");
  const currentUserId = useAuthStore((state) => state.user?.id ?? "");
  const { notify, Toast } = useToast();
  const { count: totalUnreadCount } = useInboxUnreadCount();

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, InboxChatMessage[]>>({});
  const [contacts, setContacts] = useState<Record<string, InboxContact>>({});
  const [activitiesByConversation, setActivitiesByConversation] = useState<Record<string, InboxActivityEvent[]>>({});
  const [workspaceNotes, setWorkspaceNotes] = useState<Record<string, InboxWorkspaceNote[]>>({});
  const [unreadByChannelId, setUnreadByChannelId] = useState<Record<string, number>>({});

  const [activeTab, setActiveTab] = useState<InboxTab>("open");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobilePane, setMobilePane] = useState<InboxMobilePane>("list");
  const isNarrow = useIsNarrowViewport(768);
  const pendingMessagesRef = useRef<
    Record<string, { conversationId: string; input: ComposerSendInput; preview: string }>
  >({});

  const loadContacts = useCallback(async () => {
    const result = await contactService.list({ page_size: 100 });
    const mapped: Record<string, InboxContact> = {};
    for (const contact of result.items) {
      mapped[contact.id] = mapContactToInboxContact(contact, true);
    }
    setContacts(mapped);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    filterKey,
    conversations,
    loading,
    error,
    hasMore,
    fetchNextPage,
    refresh,
    isFetchingNextPage,
    applyListDelta,
  } = useInboxList({
    tab: activeTab,
    channelFilter: channelId,
    agentFilter,
    search: debouncedSearch,
    currentUserId,
  });

  useInboxRealtimeCache(filterKey);

  const { channels, loading: channelsLoading } = useInboxChannels(unreadByChannelId);
  const { agents, agentNameById } = useInboxAgents();

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const onContactsUpdated = () => {
      void loadContacts();
    };
    window.addEventListener(CONTACTS_UPDATED_EVENT, onContactsUpdated);
    return () => window.removeEventListener(CONTACTS_UPDATED_EVENT, onContactsUpdated);
  }, [loadContacts]);

  useEffect(() => {
    if (selectedId || !contactParam || conversations.length === 0) return;
    const preferred = conversations.find((item) => item.contact_id === contactParam);
    if (preferred) {
      replaceParams({ c: preferred.id, contact: null });
    }
  }, [conversations, contactParam, selectedId, replaceParams]);

  const toInboxMessage = useCallback(
    (message: Message) => mapMessageToInbox(message, agentName),
    [agentName],
  );

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await conversationService.markRead(conversationId);
        await queryClient.invalidateQueries({ queryKey: inboxUnreadCountQueryKey });
      } catch {
        // Keep UI responsive even if mark-read request fails.
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    messageService
      .list(selectedId)
      .then((messages) => {
        if (cancelled) return;
        const mappedMessages = applyMessageDateLabels(sortMessagesAsc(messages.map(toInboxMessage)));
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedId]: mappedMessages,
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setMessagesByConversation((prev) => ({ ...prev, [selectedId]: [] }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, toInboxMessage]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    Promise.all([conversationService.listActivities(selectedId), conversationService.listNotes(selectedId)])
      .then(([activities, notes]) => {
        if (cancelled) return;
        setActivitiesByConversation((prev) => ({ ...prev, [selectedId]: activities }));
        setWorkspaceNotes((prev) => ({ ...prev, [selectedId]: notes }));
      })
      .catch(() => {
        if (!cancelled) {
          setActivitiesByConversation((prev) => ({ ...prev, [selectedId]: [] }));
          setWorkspaceNotes((prev) => ({ ...prev, [selectedId]: [] }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const resolvedConversations = useMemo(
    () =>
      conversations.map((conversation) => {
        // The inbox list only carries `assigned_to`, so the agent name comes from the directory.
        const withAssignee = withResolvedAssignee(conversation, agentNameById);
        const contact = contacts[withAssignee.contact_id];
        if (!contact) return withAssignee;
        const resolvedName = contact.contact_name || contact.name || withAssignee.contact_name;
        const resolvedPhone = contact.phone || withAssignee.contact_phone;
        if (resolvedName === withAssignee.contact_name && resolvedPhone === withAssignee.contact_phone) {
          return withAssignee;
        }
        return {
          ...withAssignee,
          contact_name: resolvedName,
          contact_phone: resolvedPhone,
        };
      }),
    [conversations, contacts, agentNameById],
  );

  const tabCounts = useMemo(
    () => computeInboxTabCounts(resolvedConversations, currentUserId),
    [resolvedConversations, currentUserId],
  );

  useEffect(() => {
    if (channelId === "all") {
      const next: Record<string, number> = {};
      for (const conversation of resolvedConversations) {
        const id = conversation.channel_id;
        const unread = conversation.unread_count ?? 0;
        if (!id || unread <= 0) continue;
        next[id] = (next[id] ?? 0) + unread;
      }
      setUnreadByChannelId(next);
      return;
    }
    const sum = resolvedConversations.reduce((total, conversation) => total + (conversation.unread_count ?? 0), 0);
    setUnreadByChannelId((prev) => ({ ...prev, [channelId]: sum }));
  }, [resolvedConversations, channelId]);

  const selectedConversation = resolvedConversations.find((c) => c.id === selectedId) ?? null;
  const selectedChannelLabel = useMemo(() => {
    if (!selectedConversation?.channel_id) return undefined;
    return channels.find((channel) => channel.id === selectedConversation.channel_id)?.label;
  }, [channels, selectedConversation?.channel_id]);
  const {
    typingLabel,
    viewerLabel,
    applySnapshot,
    notifyTypingStart,
    notifyTypingStop,
  } = useConversationPresence(selectedId);
  const selectedUnreadCount = selectedConversation?.unread_count ?? 0;
  const selectedMessages = useMemo(
    () => (selectedId ? (messagesByConversation[selectedId] ?? []) : []),
    [messagesByConversation, selectedId],
  );
  const selectedContact = selectedConversation ? contacts[selectedConversation.contact_id] ?? null : null;
  const selectedActivities = selectedId ? (activitiesByConversation[selectedId] ?? []) : [];
  const selectedNotes = selectedId ? (workspaceNotes[selectedId] ?? []) : [];

  useEffect(() => {
    if (!selectedId || selectedUnreadCount <= 0) return;
    void markConversationAsRead(selectedId);
    applyListDelta({ conversation_id: selectedId, unread_count: 0 });
  }, [selectedId, selectedUnreadCount, markConversationAsRead, applyListDelta]);

  const agentFilterOptions = useMemo(
    () => agents.map((agent) => ({ id: agent.id, name: agent.name })),
    [agents],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const conversation = resolvedConversations.find((item) => item.id === id);
      setSelectedId(id);
      setMobilePane("workspace");
      if ((conversation?.unread_count ?? 0) > 0) {
        applyListDelta({ conversation_id: id, unread_count: 0 });
        void markConversationAsRead(id);
      }
    },
    [resolvedConversations, markConversationAsRead, applyListDelta, setSelectedId],
  );

  const handleBackToList = useCallback(() => {
    setSelectedId(null);
    setMobilePane("list");
  }, [setSelectedId]);

  const handleOpenContext = useCallback(() => {
    setMobilePane("context");
  }, []);

  const handleCloseContext = useCallback(() => {
    setMobilePane(selectedId ? "workspace" : "list");
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMobilePane("list");
      return;
    }
    setMobilePane((prev) => (prev === "list" ? "workspace" : prev));
  }, [selectedId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;

      if (event.key === "/" && !isTypingTarget) {
        event.preventDefault();
        document.getElementById("inbox-search")?.focus();
        return;
      }

      if (event.key === "Escape") {
        if (mobilePane === "context") {
          event.preventDefault();
          handleCloseContext();
          return;
        }
        if (isNarrow && mobilePane === "workspace" && selectedId) {
          event.preventDefault();
          handleBackToList();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleBackToList, handleCloseContext, isNarrow, mobilePane, selectedId]);

  const handleConversationUpdate = useCallback(
    (updated: InboxConversation) => {
      applyListDelta({
        conversation_id: updated.id,
        status: updated.status,
        assigned_to: updated.assigned_to ?? null,
        assignee_name: updated.assignee_name ?? null,
        unread_count: updated.unread_count,
        last_message: updated.last_message_preview,
        last_message_at: updated.last_message_at,
        priority_score: updated.priority_score,
        waiting_since: updated.waiting_since,
      });
    },
    [applyListDelta],
  );

  const dispatchSend = useCallback(
    async (conversationId: string, clientMessageId: string, input: ComposerSendInput) => {
      try {
        const sent = await messageService.send(conversationId, {
          content: input.content,
          storage_object_id: input.storageObjectId,
          reply_to_message_id: input.replyToMessageId,
          client_message_id: clientMessageId,
        });
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: applyMessageDateLabels(
            sortMessagesAsc(reconcileApiMessage(prev[conversationId] ?? [], sent, agentName)),
          ),
        }));
        if (sent.delivery_notice) {
          notify("success", sent.delivery_notice);
        }
        delete pendingMessagesRef.current[clientMessageId];
      } catch (error) {
        console.error("[Inbox] Send message failed", {
          conversationId,
          error: formatApiErrorMessage(error),
          raw: error,
        });
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: applyMessageDateLabels(
            sortMessagesAsc(
              markMessageFailed(
                prev[conversationId] ?? [],
                clientMessageId,
                formatApiErrorMessage(error),
              ),
            ),
          ),
        }));
      }
    },
    [agentName, notify],
  );

  const handleSendMessage = useCallback(
    (input: ComposerSendInput) => {
      if (!selectedId || !selectedConversation) return;
      const clientMessageId = generateUUID();
      const messageType = input.attachment
        ? contentTypeFromMime(input.attachment.mime_type)
        : "text";
      const preview = optimisticAttachmentPreview(input);
      const optimistic: InboxChatMessage = {
        id: clientMessageId,
        client_message_id: clientMessageId,
        conversation_id: selectedId,
        direction: "outbound",
        type: messageType,
        content: input.content || (messageType === "audio" ? "Voice note" : preview),
        sent_at: new Date().toISOString(),
        send_status: "sending",
        sender_name: agentName,
        reply_to_message_id: input.replyToMessageId,
        attachment: input.attachment,
      };

      pendingMessagesRef.current[clientMessageId] = {
        conversationId: selectedId,
        input,
        preview,
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedId]: applyMessageDateLabels(
          sortMessagesAsc(upsertOptimisticMessage(prev[selectedId] ?? [], optimistic)),
        ),
      }));

      applyListDelta({
        conversation_id: selectedId,
        last_message: preview,
        last_message_at: optimistic.sent_at,
        unread_count: 0,
      });

      void dispatchSend(selectedId, clientMessageId, input);
    },
    [selectedConversation, selectedId, agentName, applyListDelta, dispatchSend],
  );

  const handleRetryMessage = useCallback(
    (clientMessageId: string) => {
      const pending = pendingMessagesRef.current[clientMessageId];
      if (!pending) return;
      setMessagesByConversation((prev) => ({
        ...prev,
        [pending.conversationId]: applyMessageDateLabels(
          sortMessagesAsc(markMessageSending(prev[pending.conversationId] ?? [], clientMessageId)),
        ),
      }));
      void dispatchSend(pending.conversationId, clientMessageId, pending.input);
    },
    [dispatchSend],
  );

  const handleSaveNote = useCallback(
    async (content: string) => {
      if (!selectedId) return;
      try {
        const note = await conversationService.createNote(selectedId, content);
        setWorkspaceNotes((prev) => ({
          ...prev,
          [selectedId]: [note, ...(prev[selectedId] ?? [])],
        }));
        notify("success", "Internal note saved");
      } catch (err) {
        notify("error", err instanceof Error ? err.message : "Failed to save note");
      }
    },
    [selectedId, notify],
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!selectedId) return;
      const updated = await messageService.remove(selectedId, messageId);
      const mapped = toInboxMessage(updated);
      setMessagesByConversation((prev) => {
        const existing = prev[selectedId] ?? [];
        return {
          ...prev,
          [selectedId]: applyMessageDateLabels(
            sortMessagesAsc(existing.map((item) => (item.id === messageId ? { ...item, ...mapped } : item))),
          ),
        };
      });
    },
    [selectedId, toInboxMessage],
  );

  const handleToggleSubscription = useCallback(async () => {
    if (!selectedContact) return;
    const nextConsent: ConsentStatus =
      selectedContact.subscription_status === "subscribed" ? "opt_out" : "opt_in";
    try {
      const updated = await contactService.update(selectedContact.id, { consent_status: nextConsent });
      const inboxContact = mapContactToInboxContact(updated, true);
      setContacts((prev) => ({ ...prev, [updated.id]: inboxContact }));
      notify("success", `Subscription status changed to ${inboxContact.subscription_status}`);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to update subscription");
    }
  }, [selectedContact, notify]);

  const handleSaveContact = useCallback(
    async (input: {
      contact_name: string;
      customer_name?: string;
      phone: string;
      email?: string;
      consent_status?: ConsentStatus;
    }) => {
      if (!selectedContact) return;
      try {
        const updated = await contactService.update(selectedContact.id, input);
        const inboxContact = mapContactToInboxContact(updated, true);

        setContacts((prev) => ({ ...prev, [updated.id]: inboxContact }));
        if (selectedConversation?.contact_id === updated.id) {
          void loadContacts();
        }
        notify("success", "Contact saved");
      } catch (err) {
        notify("error", err instanceof Error ? err.message : "Failed to save contact");
        throw err;
      }
    },
    [selectedContact, selectedConversation, notify, loadContacts],
  );

  const handleAddTag = useCallback(() => {
    notify("success", "Tag management is available from the Contacts page");
  }, [notify]);

  useInboxRealtime({
    onCollisionUpdate: applySnapshot,
    onMessageStatusUpdated: (payload) => {
      if (!payload.conversation_id) return;
      setMessagesByConversation((prev) => ({
        ...prev,
        [payload.conversation_id!]: applyMessageDateLabels(
          sortMessagesAsc(applyMessageStatusUpdate(prev[payload.conversation_id!] ?? [], payload)),
        ),
      }));
    },
    onMessageCreated: (rawMessage) => {
      const message = normalizeMessage(rawMessage);

      setMessagesByConversation((prev) => {
        const existing = prev[message.conversation_id] ?? [];
        return {
          ...prev,
          [message.conversation_id]: applyMessageDateLabels(
            sortMessagesAsc(reconcileApiMessage(existing, message, agentName)),
          ),
        };
      });

      const currentConversation = conversations.find((item) => item.id === message.conversation_id);
      const currentUnread = currentConversation?.unread_count ?? 0;
      const nextUnread =
        message.direction === "inbound" && selectedId !== message.conversation_id
          ? currentUnread + 1
          : selectedId === message.conversation_id
            ? 0
            : currentUnread;
      applyListDelta({
        conversation_id: message.conversation_id,
        last_message: message.content,
        last_message_at: message.sent_at,
        unread_count: nextUnread,
      });

      if (selectedId === message.conversation_id && message.direction === "inbound") {
        void markConversationAsRead(message.conversation_id);
      }

      if (message.direction === "inbound" && selectedId !== message.conversation_id) {
        const channel = currentConversation?.channel ?? "whatsapp";
        const contactName = currentConversation?.contact_name?.trim() || "New message";
        const preview = message.content?.trim() || "Media";
        notify(
          "success",
          `${CHANNEL_NOTIFY_PREFIX[channel] ?? channel} · ${contactName} · ${preview}`,
        );
      }
    },
    onActivityCreated: (activity, conversationId) => {
      const targetId = conversationId ?? selectedId;
      if (!targetId) return;
      setActivitiesByConversation((prev) => {
        const existing = prev[targetId] ?? [];
        if (existing.some((item) => item.id === activity.id)) {
          return prev;
        }
        return { ...prev, [targetId]: [activity, ...existing] };
      });
    },
    onNoteCreated: (note, conversationId) => {
      const targetId = conversationId ?? selectedId;
      if (!targetId) return;
      setWorkspaceNotes((prev) => {
        const existing = prev[targetId] ?? [];
        if (existing.some((item) => item.id === note.id)) {
          return prev;
        }
        return { ...prev, [targetId]: [note, ...existing] };
      });
      setActivitiesByConversation((prev) => ({
        ...prev,
        [targetId]: [
          {
            id: `activity-note-${note.id}`,
            type: "note_added",
            description: `Internal note added by ${note.author}`,
            created_at: note.created_at,
          },
          ...(prev[targetId] ?? []),
        ],
      }));
    },
  });

  return (
    <div className="flex h-full flex-col">
      {error ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">{error}</div>
      ) : (
        <InboxLayout
          mobilePane={mobilePane}
          onCloseContext={handleCloseContext}
          channelSidebar={
            <ChannelSidebar
              channels={channels}
              activeChannelId={channelId}
              allUnreadCount={totalUnreadCount}
              loading={channelsLoading}
              onSelect={setChannelId}
            />
          }
          conversationList={
            <ConversationList
              conversations={resolvedConversations}
              selectedId={selectedId}
              activeTab={activeTab}
              tabCounts={tabCounts}
              activeChannelId={channelId}
              channels={channels}
              agentFilter={agentFilter}
              search={search}
              agents={agentFilterOptions}
              loading={loading}
              hasMore={hasMore}
              isFetchingNextPage={isFetchingNextPage}
              showAgentFilter={activeTab === "all" || activeTab === "closed"}
              onTabChange={(tab) => {
                setActiveTab(tab);
                if (tab !== "all" && tab !== "closed") {
                  setAgentFilter("all");
                }
              }}
              onChannelSelect={setChannelId}
              onAgentFilterChange={setAgentFilter}
              onSearchChange={setSearch}
              onSelect={handleSelect}
              onRefresh={() => void refresh()}
              onLoadMore={fetchNextPage}
            />
          }
          workspace={
            <ConversationDetail
              conversation={selectedConversation}
              channelLabel={selectedChannelLabel}
              messages={selectedMessages}
              activities={selectedActivities}
              presenceLabel={typingLabel ?? viewerLabel}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onRetryMessage={handleRetryMessage}
              onConversationUpdate={handleConversationUpdate}
              onSaveNote={handleSaveNote}
              onAddTag={handleAddTag}
              onBack={isNarrow ? handleBackToList : undefined}
              onOpenContext={handleOpenContext}
              onNotify={(message, type = "success") => notify(type, message)}
              onTypingStart={notifyTypingStart}
              onTypingStop={notifyTypingStop}
            />
          }
          contextSidebar={
            <ContactSidebar
              contact={selectedContact}
              conversation={selectedConversation}
              channelLabel={selectedChannelLabel}
              activities={selectedActivities}
              notes={selectedNotes}
              onSendMessage={() => notify("success", "Focus moved to message composer")}
              onAddTag={handleAddTag}
              onToggleSubscription={() => void handleToggleSubscription()}
              onSaveContact={handleSaveContact}
            />
          }
        />
      )}

      <Toast />
    </div>
  );
}
