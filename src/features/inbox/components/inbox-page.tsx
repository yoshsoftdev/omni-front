"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CONTACTS_UPDATED_EVENT, contactService } from "@/features/contacts/services/contact.service";
import { ChannelSidebar } from "@/features/inbox/components/channel-sidebar/channel-sidebar";
import { ContactSidebar } from "@/features/inbox/components/contact-sidebar";
import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import {
  InboxLayout,
  type InboxMobilePane,
} from "@/features/inbox/components/layout/inbox-layout";
import { useConversationPresence } from "@/features/inbox/hooks/use-conversation-presence";
import { useConversationThread } from "@/features/inbox/hooks/use-conversation-thread";
import { useInboxAgents } from "@/features/inbox/hooks/use-inbox-agents";
import { useInboxChannels } from "@/features/inbox/hooks/use-inbox-channels";
import { useInboxList } from "@/features/inbox/hooks/use-inbox-list";
import { useInboxRealtime } from "@/features/inbox/hooks/use-inbox-realtime";
import { useInboxRealtimeCache } from "@/features/inbox/hooks/use-inbox-realtime-cache";
import { useInboxSelection } from "@/features/inbox/hooks/use-inbox-selection";
import { useInboxShortcuts } from "@/features/inbox/hooks/use-inbox-shortcuts";
import { useInboxUnreadCount } from "@/features/inbox/hooks/use-inbox-unread-count";
import { useIsNarrowViewport } from "@/features/inbox/hooks/use-is-narrow-viewport";
import { mapContactToInboxContact } from "@/features/inbox/mappers/inbox.mapper";
import { normalizeMessage } from "@/features/inbox/mappers/message.mapper";
import { inboxUnreadCountQueryKey } from "@/features/inbox/query-keys";
import { conversationService } from "@/features/inbox/services/conversation.service";
import type {
  InboxChannel,
  InboxContact,
  InboxConversation,
  InboxTab,
} from "@/features/inbox/types";
import { computeInboxTabCounts } from "@/features/inbox/utils/conversation-filters";
import { withResolvedAssignee } from "@/features/inbox/utils/resolve-assignee";
import {
  sortConversations,
  type ConversationListSort,
} from "@/features/inbox/utils/sort-conversations";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";
import { useAuthStore } from "@/store/auth-store";
import type { ConsentStatus } from "@/types/contact";

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

  const [contacts, setContacts] = useState<Record<string, InboxContact>>({});
  const [unreadByChannelId, setUnreadByChannelId] = useState<Record<string, number>>({});

  const [activeTab, setActiveTab] = useState<InboxTab>("open");
  const [agentFilter, setAgentFilter] = useState("all");
  const [sort, setSort] = useState<ConversationListSort>("recent");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobilePane, setMobilePane] = useState<InboxMobilePane>("list");
  const isNarrow = useIsNarrowViewport(768);

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
  const selectedContact = selectedConversation ? contacts[selectedConversation.contact_id] ?? null : null;
  const thread = useConversationThread({ selectedId, agentName, notify, applyListDelta });
  const sortedConversations = useMemo(
    () => sortConversations(resolvedConversations, sort),
    [resolvedConversations, sort],
  );

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

  useInboxShortcuts({
    orderedIds: useMemo(() => sortedConversations.map((c) => c.id), [sortedConversations]),
    selectedId,
    onSelect: handleSelect,
    onEscape: () => {
      if (mobilePane === "context") {
        handleCloseContext();
        return true;
      }
      if (isNarrow && mobilePane === "workspace" && selectedId) {
        handleBackToList();
        return true;
      }
      return false;
    },
  });

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
      notify("error", formatApiErrorMessage(err));
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
        notify("error", formatApiErrorMessage(err));
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
    onMessageStatusUpdated: thread.applyStatus,
    onMessageCreated: (rawMessage) => {
      const message = normalizeMessage(rawMessage);
      thread.applyMessage(message);

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
      if (targetId) thread.applyActivity(activity, targetId);
    },
    onNoteCreated: (note, conversationId) => {
      const targetId = conversationId ?? selectedId;
      if (targetId) thread.applyNote(note, targetId);
    },
  });

  return (
    <div className="flex h-full flex-col">
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
              conversations={sortedConversations}
              sort={sort}
              onSortChange={setSort}
              error={error}
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
              messages={thread.messages}
              messagesLoading={thread.loading}
              messagesError={thread.error}
              onRetryLoad={thread.reload}
              activities={thread.activities}
              presenceLabel={typingLabel ?? viewerLabel}
              onSendMessage={thread.send}
              onDeleteMessage={thread.deleteMessage}
              onRetryMessage={thread.retry}
              onConversationUpdate={handleConversationUpdate}
              onSaveNote={thread.saveNote}
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
              activities={thread.activities}
              notes={thread.notes}
              onSendMessage={() => notify("success", "Focus moved to message composer")}
              onAddTag={handleAddTag}
              onToggleSubscription={() => void handleToggleSubscription()}
              onSaveContact={handleSaveContact}
            />
          }
        />

      <Toast />
    </div>
  );
}
