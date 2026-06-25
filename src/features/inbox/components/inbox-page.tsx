"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ContactSidebar } from "@/features/inbox/components/contact-sidebar";
import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import {
  mapConversationToInbox,
  mapConversationToInboxContact,
  mapMessageToInbox,
} from "@/features/inbox/mappers/inbox.mapper";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { messageService } from "@/features/inbox/services/message.service";
import type {
  InboxActivityEvent,
  InboxChatMessage,
  InboxContact,
  InboxConversation,
  InboxTab,
  InboxWorkspaceNote,
} from "@/features/inbox/types";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 7;

function filterByTab(conversations: InboxConversation[], tab: InboxTab) {
  switch (tab) {
    case "open":
      return conversations.filter((c) => c.status !== "closed");
    case "assigned":
      return conversations.filter((c) => c.assigned_to && c.status !== "closed");
    case "unassigned":
      return conversations.filter((c) => !c.assigned_to && c.status !== "closed");
    case "closed":
      return conversations.filter((c) => c.status === "closed");
    default:
      return conversations;
  }
}

function computeTabCounts(conversations: InboxConversation[]) {
  return {
    open: filterByTab(conversations, "open").length,
    assigned: filterByTab(conversations, "assigned").length,
    unassigned: filterByTab(conversations, "unassigned").length,
    closed: filterByTab(conversations, "closed").length,
    all: conversations.length,
  };
}

export function InboxPage() {
  const { notify, Toast } = useToast();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, InboxChatMessage[]>>({});
  const [contacts, setContacts] = useState<Record<string, InboxContact>>({});
  const [activities] = useState<Record<string, InboxActivityEvent[]>>({});
  const [workspaceNotes, setWorkspaceNotes] = useState<Record<string, InboxWorkspaceNote[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>("open");
  const [channelFilter, setChannelFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await conversationService.list({ page_size: 100 });
      const mapped = items.map(mapConversationToInbox);
      setConversations(mapped);
      const contactMap: Record<string, InboxContact> = {};
      for (const item of items) {
        contactMap[item.contact_id] = mapConversationToInboxContact(item);
      }
      setContacts(contactMap);
      setSelectedId((current) => current ?? mapped[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    messageService
      .list(selectedId)
      .then((messages) => {
        if (cancelled) return;
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedId]: messages.map(mapMessageToInbox),
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
  }, [selectedId]);

  const tabCounts = useMemo(() => computeTabCounts(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    let list = filterByTab(conversations, activeTab);
    if (channelFilter !== "all") {
      list = list.filter((c) => c.channel === channelFilter);
    }
    if (agentFilter !== "all") {
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
  }, [conversations, activeTab, channelFilter, agentFilter, search]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedMessages = selectedId ? (messagesByConversation[selectedId] ?? []) : [];
  const selectedContact = selectedConversation
    ? (contacts[selectedConversation.contact_id] ?? mapConversationToInboxContact({
        id: selectedConversation.id,
        contact_id: selectedConversation.contact_id,
        contact_name: selectedConversation.contact_name,
        contact_phone: selectedConversation.contact_phone,
        device_id: "",
        status: "open",
        unread_count: selectedConversation.unread_count,
      }))
    : null;
  const selectedActivities = selectedContact ? (activities[selectedContact.id] ?? []) : [];
  const selectedNotes = selectedContact ? (workspaceNotes[selectedContact.id] ?? []) : [];

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
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
  }, []);

  const handleConversationUpdate = useCallback((updated: InboxConversation) => {
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleMessagesChange = useCallback(
    async (messages: InboxChatMessage[]) => {
      if (!selectedId) return;
      setMessagesByConversation((prev) => ({ ...prev, [selectedId]: messages }));
    },
    [selectedId],
  );

  const handleSaveNote = useCallback(
    (content: string) => {
      if (!selectedContact) return;
      const note: InboxWorkspaceNote = {
        id: `note-${Date.now()}`,
        category: "internal",
        content,
        author: "You",
        created_at: new Date().toISOString(),
      };
      setWorkspaceNotes((prev) => ({
        ...prev,
        [selectedContact.id]: [note, ...(prev[selectedContact.id] ?? [])],
      }));
      notify("success", "Internal note saved");
    },
    [selectedContact, notify],
  );

  const handleToggleSubscription = useCallback(() => {
    if (!selectedContact) return;
    const next = selectedContact.subscription_status === "subscribed" ? "unsubscribed" : "subscribed";
    setContacts((prev) => ({
      ...prev,
      [selectedContact.id]: { ...selectedContact, subscription_status: next },
    }));
    notify("success", `Subscription status changed to ${next}`);
  }, [selectedContact, notify]);

  const handleAddTag = useCallback(() => {
    if (!selectedContact) return;
    const newTag = { id: `tag-${Date.now()}`, name: "New Tag", color: "#6366F1" };
    setContacts((prev) => ({
      ...prev,
      [selectedContact.id]: { ...selectedContact, tags: [...selectedContact.tags, newTag] },
    }));
    if (selectedConversation) {
      handleConversationUpdate({
        ...selectedConversation,
        tags: [...selectedConversation.tags, newTag],
      });
    }
    notify("success", "Tag added");
  }, [selectedContact, selectedConversation, handleConversationUpdate, notify]);

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
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
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
          onRefresh={() => void loadConversations()}
        />

        <ConversationDetail
          conversation={selectedConversation}
          messages={selectedMessages}
          onMessagesChange={handleMessagesChange}
          onConversationUpdate={handleConversationUpdate}
          onSaveNote={handleSaveNote}
          onNotify={(msg) => notify("success", msg)}
        />

        <ContactSidebar
          contact={selectedContact}
          activities={selectedActivities}
          notes={selectedNotes}
          onSendMessage={() => notify("success", "Focus moved to message composer")}
          onAddTag={handleAddTag}
          onToggleSubscription={handleToggleSubscription}
        />
        </>
        )}
      </div>

      <Toast />
    </div>
  );
}
