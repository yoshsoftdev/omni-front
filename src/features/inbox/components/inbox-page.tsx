"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { CONTACTS_UPDATED_EVENT, contactService } from "@/features/contacts/services/contact.service";
import { ContactSidebar } from "@/features/inbox/components/contact-sidebar";
import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import type { ComposerSendInput } from "@/features/inbox/components/message-composer";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import { useInboxList } from "@/features/inbox/hooks/use-inbox-list";
import { useConversationPresence } from "@/features/inbox/hooks/use-conversation-presence";
import { useInboxRealtime } from "@/features/inbox/hooks/use-inbox-realtime";
import { useInboxRealtimeCache } from "@/features/inbox/hooks/use-inbox-realtime-cache";
import {
  applyMessageStatusUpdate,
  markMessageFailed,
  markMessageSending,
  reconcileApiMessage,
  upsertOptimisticMessage,
} from "@/features/inbox/lib/message-reconcile";
import { mapContactToInboxContact, mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { normalizeMessage } from "@/features/inbox/mappers/message.mapper";
import { inboxUnreadCountQueryKey } from "@/features/inbox/query-keys";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { messageService } from "@/features/inbox/services/message.service";
import { computeInboxTabCounts } from "@/features/inbox/utils/conversation-filters";
import { applyMessageDateLabels } from "@/features/inbox/utils/message-date";
import { generateUUID } from "@/lib/uuid";
import type {
  InboxActivityEvent,
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

function sortMessagesAsc(messages: InboxChatMessage[]) {
  return [...messages].sort((a, b) => toMillis(a.sent_at) - toMillis(b.sent_at));
}

export function InboxPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const contactParam = searchParams.get("contact");
  const agentName = useAuthStore((state) => state.user?.name ?? "");
  const currentUserId = useAuthStore((state) => state.user?.id ?? "");
  const { notify, Toast } = useToast();

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, InboxChatMessage[]>>({});
  const [contacts, setContacts] = useState<Record<string, InboxContact>>({});
  const [activitiesByConversation, setActivitiesByConversation] = useState<Record<string, InboxActivityEvent[]>>({});
  const [workspaceNotes, setWorkspaceNotes] = useState<Record<string, InboxWorkspaceNote[]>>({});

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>("open");
  const [channelFilter, setChannelFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    channelFilter,
    agentFilter,
    search: debouncedSearch,
    currentUserId,
  });

  useInboxRealtimeCache(filterKey);

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
    if (preferred) setSelectedId(preferred.id);
  }, [conversations, contactParam, selectedId]);

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
        const contact = contacts[conversation.contact_id];
        if (!contact) return conversation;
        const resolvedName = contact.contact_name || contact.name || conversation.contact_name;
        const resolvedPhone = contact.phone || conversation.contact_phone;
        if (resolvedName === conversation.contact_name && resolvedPhone === conversation.contact_phone) {
          return conversation;
        }
        return {
          ...conversation,
          contact_name: resolvedName,
          contact_phone: resolvedPhone,
        };
      }),
    [conversations, contacts],
  );

  const tabCounts = useMemo(
    () => computeInboxTabCounts(resolvedConversations, currentUserId),
    [resolvedConversations, currentUserId],
  );

  const selectedConversation = resolvedConversations.find((c) => c.id === selectedId) ?? null;
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

  const agents = useMemo(() => {
    const map = new Map<string, string>();
    for (const conv of resolvedConversations) {
      if (conv.assigned_to && conv.assignee_name) {
        map.set(conv.assigned_to, conv.assignee_name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [resolvedConversations]);

  const handleSelect = useCallback(
    (id: string) => {
      const conversation = resolvedConversations.find((item) => item.id === id);
      setSelectedId(id);
      if ((conversation?.unread_count ?? 0) > 0) {
        applyListDelta({ conversation_id: id, unread_count: 0 });
        void markConversationAsRead(id);
      }
    },
    [resolvedConversations, markConversationAsRead, applyListDelta],
  );

  const handleConversationUpdate = useCallback(
    (updated: InboxConversation) => {
      applyListDelta({
        conversation_id: updated.id,
        status: updated.status,
        assigned_to: updated.assigned_to,
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
    async (conversationId: string, clientMessageId: string, input: ComposerSendInput, preview: string) => {
      const replyToWAMID =
        input.replyToMessageId
          ? (messagesByConversation[conversationId] ?? []).find((message) => message.id === input.replyToMessageId)?.wamid
          : undefined;

      try {
        const sent = await messageService.send(conversationId, {
          content: input.content,
          storage_object_id: input.storageObjectId,
          reply_to_wamid: replyToWAMID,
          client_message_id: clientMessageId,
        });
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: applyMessageDateLabels(
            sortMessagesAsc(reconcileApiMessage(prev[conversationId] ?? [], sent, agentName)),
          ),
        }));
        delete pendingMessagesRef.current[clientMessageId];
      } catch (error) {
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
    [agentName, messagesByConversation],
  );

  const handleSendMessage = useCallback(
    (input: ComposerSendInput) => {
      if (!selectedId || !selectedConversation) return;
      const clientMessageId = generateUUID();
      const preview = input.content || "Media";
      const optimistic: InboxChatMessage = {
        id: clientMessageId,
        client_message_id: clientMessageId,
        conversation_id: selectedId,
        direction: "outbound",
        type: input.storageObjectId ? "document" : "text",
        content: input.content,
        sent_at: new Date().toISOString(),
        send_status: "sending",
        sender_name: agentName,
        reply_to_message_id: input.replyToMessageId,
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

      void dispatchSend(selectedId, clientMessageId, input, preview);
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
      void dispatchSend(pending.conversationId, clientMessageId, pending.input, pending.preview);
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
      <div className="shrink-0 border-b bg-background px-4 py-4 md:px-6">
        <PageHeader
          title="Inbox"
          description="Manage all customer conversations in one place."
        />
      </div>

      <div className="flex min-h-0 flex-1">
        {error ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">{error}</div>
        ) : (
          <>
            <ConversationList
              conversations={resolvedConversations}
              selectedId={selectedId}
              activeTab={activeTab}
              tabCounts={tabCounts}
              channelFilter={channelFilter}
              agentFilter={agentFilter}
              search={search}
              agents={agents}
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
              onChannelFilterChange={setChannelFilter}
              onAgentFilterChange={setAgentFilter}
              onSearchChange={setSearch}
              onSelect={handleSelect}
              onRefresh={() => void refresh()}
              onLoadMore={fetchNextPage}
            />

            <ConversationDetail
              conversation={selectedConversation}
              messages={selectedMessages}
              presenceLabel={typingLabel ?? viewerLabel}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onRetryMessage={handleRetryMessage}
              onConversationUpdate={handleConversationUpdate}
              onSaveNote={handleSaveNote}
              onNotify={(message, type = "success") => notify(type, message)}
              onTypingStart={notifyTypingStart}
              onTypingStop={notifyTypingStop}
            />

            <ContactSidebar
              contact={selectedContact}
              activities={selectedActivities}
              notes={selectedNotes}
              onSendMessage={() => notify("success", "Focus moved to message composer")}
              onAddTag={handleAddTag}
              onToggleSubscription={() => void handleToggleSubscription()}
              onSaveContact={handleSaveContact}
            />
          </>
        )}
      </div>

      <Toast />
    </div>
  );
}
