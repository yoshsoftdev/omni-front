"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { contactService } from "@/features/contacts/services/contact.service";
import { resolveContactDisplayName, resolveConversationContactLabel } from "@/features/contacts/utils/contact-identity";
import { ContactSidebar } from "@/features/inbox/components/contact-sidebar";
import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import type { ComposerSendInput } from "@/features/inbox/components/message-composer";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import { useInboxRealtime } from "@/features/inbox/hooks/use-inbox-realtime";
import { mapContactToInboxContact, mapConversationToInbox, mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { normalizeConversation } from "@/features/inbox/mappers/conversation.mapper";
import { normalizeMessage } from "@/features/inbox/mappers/message.mapper";
import { inboxUnreadCountQueryKey } from "@/features/inbox/query-keys";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { messageService } from "@/features/inbox/services/message.service";
import { enrichInboxData, mergeRealtimeConversation } from "@/features/inbox/utils/enrich-inbox";
import {
  computeInboxTabCounts,
  filterConversationsByTab,
  patchConversationStatus,
} from "@/features/inbox/utils/conversation-filters";
import { conversationsMatchId } from "@/features/inbox/utils/realtime-conversation";
import { applyMessageDateLabels } from "@/features/inbox/utils/message-date";
import type {
  InboxActivityEvent,
  InboxChatMessage,
  InboxContact,
  InboxConversation,
  InboxTab,
  InboxWorkspaceNote,
} from "@/features/inbox/types";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import type { ConsentStatus } from "@/types/contact";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";

const PAGE_SIZE = 7;

function toMillis(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortMessagesAsc(messages: InboxChatMessage[]) {
  return [...messages].sort((a, b) => toMillis(a.sent_at) - toMillis(b.sent_at));
}

function sortByLatest(conversations: InboxConversation[]) {
  return [...conversations].sort((a, b) => {
    const bTime = toMillis(b.last_message_at);
    const aTime = toMillis(a.last_message_at);
    return bTime - aTime;
  });
}

export function InboxPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const contactParam = searchParams.get("contact");
  const agentName = useAuthStore((state) => state.user?.name ?? "");
  const currentUserId = useAuthStore((state) => state.user?.id ?? "");
  const { notify, Toast } = useToast();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, InboxChatMessage[]>>({});
  const [contacts, setContacts] = useState<Record<string, InboxContact>>({});
  const [activitiesByConversation, setActivitiesByConversation] = useState<Record<string, InboxActivityEvent[]>>({});
  const [workspaceNotes, setWorkspaceNotes] = useState<Record<string, InboxWorkspaceNote[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>("open");
  const [channelFilter, setChannelFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const loadConversations = useCallback(async (preferredContactId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const [conversationItems, contactResult] = await Promise.all([
        conversationService.list({ page_size: 100 }),
        contactService.list({ page_size: 100 }),
      ]);
      const enriched = enrichInboxData(conversationItems, contactResult.items);
      setConversations(sortByLatest(enriched.conversations));
      setContacts(enriched.contacts);

      const sortedConversations = sortByLatest(enriched.conversations);
      const preferredConversation = preferredContactId
        ? sortedConversations.find((item) => item.contact_id === preferredContactId)
        : null;

      setSelectedId((current) => preferredConversation?.id ?? current ?? sortedConversations[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations(contactParam);
  }, [loadConversations, contactParam]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    messageService
      .list(selectedId)
      .then((messages) => {
        if (cancelled) return;
        const mappedMessages = applyMessageDateLabels(sortMessagesAsc(messages.map(toInboxMessage)));
        const latestMessage = mappedMessages[mappedMessages.length - 1];
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedId]: mappedMessages,
        }));
        if (latestMessage) {
          setConversations((prev) =>
            sortByLatest(
              prev.map((conversation) =>
                conversation.id === selectedId
                  ? {
                      ...conversation,
                      last_message_preview: latestMessage.content,
                      last_message_at: latestMessage.sent_at,
                    }
                  : conversation,
              ),
            ),
          );
        }
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

  const tabCounts = useMemo(
    () => computeInboxTabCounts(conversations, currentUserId),
    [conversations, currentUserId],
  );

  const filteredConversations = useMemo(() => {
    let list = filterConversationsByTab(conversations, activeTab, currentUserId);
    if (channelFilter !== "all") {
      list = list.filter((c) => c.channel === channelFilter);
    }
    if ((activeTab === "all" || activeTab === "closed") && agentFilter !== "all") {
      list = list.filter((c) => c.assigned_to === agentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contact_name.toLowerCase().includes(q) ||
          c.contact_phone.includes(q) ||
          (c.last_message_preview?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [conversations, activeTab, channelFilter, agentFilter, search, currentUserId]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedMessages = selectedId ? (messagesByConversation[selectedId] ?? []) : [];
  const selectedContact = selectedConversation ? contacts[selectedConversation.contact_id] ?? null : null;
  const selectedActivities = selectedId ? (activitiesByConversation[selectedId] ?? []) : [];
  const selectedNotes = selectedId ? (workspaceNotes[selectedId] ?? []) : [];

  useEffect(() => {
    if (!selectedConversation || selectedConversation.unread_count <= 0) return;
    void markConversationAsRead(selectedConversation.id);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversation.id ? { ...conversation, unread_count: 0 } : conversation,
      ),
    );
  }, [selectedConversation, markConversationAsRead]);

  const agents = useMemo(() => {
    const map = new Map<string, string>();
    for (const conv of conversations) {
      if (conv.assigned_to && conv.assignee_name) {
        map.set(conv.assigned_to, conv.assignee_name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [conversations]);

  const handleSelect = useCallback((id: string) => {
    const selectedConversation = conversations.find((conversation) => conversation.id === id);
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );

    if ((selectedConversation?.unread_count ?? 0) > 0) {
      void markConversationAsRead(id);
    }
  }, [conversations, markConversationAsRead]);

  const handleConversationUpdate = useCallback((updated: InboxConversation) => {
    setConversations((prev) =>
      sortByLatest(
        prev.map((c) =>
          conversationsMatchId(c.id, updated.id)
            ? {
                ...c,
                ...updated,
                status: updated.status ?? c.status,
                contact_name: updated.contact_name || c.contact_name,
                contact_phone: updated.contact_phone || c.contact_phone,
                tags: updated.tags.length > 0 ? updated.tags : c.tags,
              }
            : c,
        ),
      ),
    );
  }, []);

  const handleSendMessage = useCallback(
    async (input: ComposerSendInput) => {
      if (!selectedId || !selectedConversation) return;
      const replyToWAMID =
        input.replyToMessageId
          ? selectedMessages.find((message) => message.id === input.replyToMessageId)?.wamid
          : undefined;

      const sent = await messageService.send(selectedId, {
        content: input.content,
        storage_object_id: input.storageObjectId,
        reply_to_wamid: replyToWAMID,
      });
      const mappedMessage = toInboxMessage(sent);
      const preview = input.content || sent.attachment?.filename || sent.content || "Media";

      setMessagesByConversation((prev) => {
        const existing = prev[selectedId] ?? [];
        if (existing.some((message) => message.id === mappedMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          [selectedId]: applyMessageDateLabels(sortMessagesAsc([...existing, mappedMessage])),
        };
      });

      setConversations((prev) =>
        sortByLatest(
          prev.map((conversation) =>
            conversation.id === selectedId
              ? {
                  ...conversation,
                  last_message_preview: preview,
                  last_message_at: mappedMessage.sent_at,
                  unread_count: 0,
                }
              : conversation,
          ),
        ),
      );
    },
    [selectedConversation, selectedId, selectedMessages, toInboxMessage],
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
    async (input: { name: string; phone: string; email?: string; consent_status?: ConsentStatus }) => {
      if (!selectedContact) return;
      try {
        const updated = await contactService.update(selectedContact.id, input);
        const displayName = resolveContactDisplayName(updated);
        const inboxContact = mapContactToInboxContact(updated, true);

        setContacts((prev) => ({ ...prev, [updated.id]: inboxContact }));
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.contact_id === updated.id
              ? { ...conversation, contact_name: displayName, contact_phone: updated.phone }
              : conversation,
          ),
        );
        notify("success", "Contact saved");
      } catch (err) {
        notify("error", err instanceof Error ? err.message : "Failed to save contact");
        throw err;
      }
    },
    [selectedContact, notify],
  );

  const handleAddTag = useCallback(() => {
    notify("success", "Tag management is available from the Contacts page");
  }, [notify]);

  useInboxRealtime({
    onMessageCreated: (rawMessage) => {
      const message = normalizeMessage(rawMessage);
      const mappedMessage = toInboxMessage(message);

      setMessagesByConversation((prev) => {
        const existing = prev[message.conversation_id] ?? [];
        const duplicate = existing.find((item) => item.id === mappedMessage.id);
        if (duplicate) {
          if (!duplicate.sender_name && mappedMessage.sender_name) {
            return {
              ...prev,
              [message.conversation_id]: existing.map((item) =>
                item.id === mappedMessage.id ? { ...item, sender_name: mappedMessage.sender_name } : item,
              ),
            };
          }
          return prev;
        }
        return {
          ...prev,
          [message.conversation_id]: applyMessageDateLabels(
            sortMessagesAsc([...existing, mappedMessage]),
          ),
        };
      });

      setConversations((prev) => {
        const exists = prev.some((conversation) => conversation.id === message.conversation_id);
        if (!exists) {
          void loadConversations();
          return prev;
        }
        return sortByLatest(
          prev.map((conversation) =>
            conversation.id === message.conversation_id
              ? {
                  ...conversation,
                  last_message_preview: message.content,
                  last_message_at: message.sent_at,
                  unread_count:
                    selectedId === conversation.id
                      ? 0
                      : conversation.unread_count + (message.direction === "inbound" ? 1 : 0),
                }
              : conversation,
          ),
        );
      });

      if (selectedId === message.conversation_id && message.direction === "inbound") {
        void markConversationAsRead(message.conversation_id);
      }
    },
    onConversationUpdated: (rawConversation) => {
      const raw = rawConversation as Conversation & { Status?: Conversation["status"] };
      const hasStatus = raw.status !== undefined || raw.Status !== undefined;
      const normalized = normalizeConversation(raw);

      setConversations((prev) => {
        const existing = prev.find((conversation) => conversationsMatchId(conversation.id, normalized.id));
        const merged = mergeRealtimeConversation(normalized, existing, undefined, { hasStatus });

        if (existing) {
          return sortByLatest(
            prev.map((conversation) => (conversationsMatchId(conversation.id, merged.id) ? merged : conversation)),
          );
        }
        return sortByLatest([merged, ...prev]);
      });

      setContacts((contactPrev) => {
        const current = contactPrev[normalized.contact_id];
        const { name, phone } = resolveConversationContactLabel(normalized.contact_id, {
          name: normalized.contact_name,
          phone: normalized.contact_phone,
          fallbackName: current?.name,
          fallbackPhone: current?.phone,
        });

        if (!current) {
          return {
            ...contactPrev,
            [normalized.contact_id]: {
              id: normalized.contact_id,
              name,
              phone,
              is_saved_contact: false,
              subscription_status: "subscribed",
              source: "whatsapp",
              added_on: normalized.created_at ?? new Date(0).toISOString(),
              last_activity: normalized.last_message_at ?? normalized.updated_at ?? new Date().toISOString(),
              language: "id",
              tags: [],
              conversations_count: 1,
              campaigns_received: 0,
              campaigns_clicked: 0,
            },
          };
        }

        return {
          ...contactPrev,
          [normalized.contact_id]: {
            ...current,
            name,
            phone: phone || current.phone,
            last_activity: normalized.last_message_at ?? current.last_activity,
          },
        };
      });
    },
    onConversationStatusChange: (conversationId, status) => {
      setConversations((prev) => patchConversationStatus(prev, conversationId, status));
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
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            No conversations found.
          </div>
        ) : (
        <>
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedId}
          activeTab={activeTab}
          tabCounts={tabCounts}
          channelFilter={channelFilter}
          agentFilter={agentFilter}
          search={search}
          page={page}
          pageSize={PAGE_SIZE}
          agents={agents}
          showAgentFilter={activeTab === "all" || activeTab === "closed"}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
            if (tab !== "all" && tab !== "closed") {
              setAgentFilter("all");
            }
          }}
          onChannelFilterChange={(v) => {
            setChannelFilter(v);
            setPage(1);
          }}
          onAgentFilterChange={(v) => {
            setAgentFilter(v);
            setPage(1);
          }}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSelect={handleSelect}
          onPageChange={setPage}
          onRefresh={() => void loadConversations(contactParam)}
        />

        <ConversationDetail
          conversation={selectedConversation}
          messages={selectedMessages}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onConversationUpdate={handleConversationUpdate}
          onSaveNote={handleSaveNote}
          onNotify={(message, type = "success") => notify(type, message)}
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
