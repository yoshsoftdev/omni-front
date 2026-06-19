"use client";

import { useCallback, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ContactSidebar } from "@/features/inbox/components/contact-sidebar";
import { ConversationDetail } from "@/features/inbox/components/conversation-detail";
import { ConversationList } from "@/features/inbox/components/conversation-list";
import {
  getContactForConversation,
  MOCK_ACTIVITIES,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_WORKSPACE_NOTES,
} from "@/features/inbox/mock-data";
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
  const [conversations, setConversations] = useState<InboxConversation[]>(MOCK_CONVERSATIONS);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, InboxChatMessage[]>>(
    () => ({ ...MOCK_MESSAGES }),
  );
  const [contacts, setContacts] = useState<Record<string, InboxContact>>(() => {
    const map: Record<string, InboxContact> = {};
    for (const conv of MOCK_CONVERSATIONS) {
      map[conv.contact_id] = getContactForConversation(conv);
    }
    return map;
  });
  const [activities, setActivities] = useState<Record<string, InboxActivityEvent[]>>(MOCK_ACTIVITIES);
  const [workspaceNotes, setWorkspaceNotes] = useState<Record<string, InboxWorkspaceNote[]>>(
    MOCK_WORKSPACE_NOTES,
  );

  const [selectedId, setSelectedId] = useState<string | null>(MOCK_CONVERSATIONS[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<InboxTab>("open");
  const [channelFilter, setChannelFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
    ? (contacts[selectedConversation.contact_id] ?? getContactForConversation(selectedConversation))
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
    (messages: InboxChatMessage[]) => {
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
          onRefresh={() => notify("success", "Conversations refreshed")}
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
      </div>

      <Toast />
    </div>
  );
}
