"use client";

import { useState } from "react";

import { ContactTimeline } from "@/features/inbox/components/contact-timeline";
import { ContactSection } from "@/features/inbox/components/contact-sidebar/contact-section";
import { ConversationInfo } from "@/features/inbox/components/contact-sidebar/conversation-info";
import { NotesPanel } from "@/features/inbox/components/contact-sidebar/notes-panel";
import { TagList } from "@/features/inbox/components/contact-sidebar/tag-list";
import type {
  InboxActivityEvent,
  InboxContact,
  InboxConversation,
  InboxWorkspaceNote,
} from "@/features/inbox/types";
import { cn } from "@/lib/utils";
import type { ConsentStatus } from "@/types/contact";

type SidebarTab = "contact" | "conversation" | "activity" | "notes";

interface ContactSidebarProps {
  contact: InboxContact | null;
  conversation?: InboxConversation | null;
  channelLabel?: string;
  activities: InboxActivityEvent[];
  notes: InboxWorkspaceNote[];
  onSendMessage: () => void;
  onAddTag: () => void;
  onToggleSubscription: () => void;
  onSaveContact?: (input: {
    contact_name: string;
    customer_name?: string;
    phone: string;
    email?: string;
    consent_status?: ConsentStatus;
  }) => Promise<void>;
}

export function ContactSidebar({
  contact,
  conversation = null,
  channelLabel,
  activities,
  notes,
  onSendMessage,
  onAddTag,
  onToggleSubscription,
  onSaveContact,
}: ContactSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("contact");

  if (!contact && !conversation) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card p-6 text-sm text-[#6B7280]">
        Select a conversation to view context.
      </div>
    );
  }

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: "contact", label: "Contact" },
    { id: "conversation", label: "Conversation" },
    { id: "activity", label: "Activity" },
    { id: "notes", label: "Notes" },
  ];

  const tagSource = conversation?.tags?.length ? conversation.tags : contact?.tags ?? [];

  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div className="flex border-b border-[#E5E7EB] dark:border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-[11px] font-medium",
              activeTab === tab.id
                ? "border-b-2 border-[#111111] text-[#111111] dark:border-foreground dark:text-foreground"
                : "text-[#6B7280] hover:text-[#111111] dark:hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "contact" ? (
          contact ? (
            <div>
              <ContactSection
                contact={contact}
                onSendMessage={onSendMessage}
                onToggleSubscription={onToggleSubscription}
                onSaveContact={onSaveContact}
              />
              <div className="border-t border-[#E5E7EB] p-5 dark:border-border">
                <TagList tags={tagSource} onAddTag={onAddTag} />
              </div>
            </div>
          ) : (
            <p className="p-5 text-sm text-[#6B7280]">No contact details available.</p>
          )
        ) : null}

        {activeTab === "conversation" ? (
          <div className="space-y-6 p-5">
            {conversation ? (
              <>
                <ConversationInfo conversation={conversation} channelLabel={channelLabel} />
                <TagList tags={tagSource} onAddTag={onAddTag} />
              </>
            ) : (
              <p className="text-sm text-[#6B7280]">No conversation selected.</p>
            )}
          </div>
        ) : null}

        {activeTab === "activity" ? (
          <div className="p-5">
            <ContactTimeline events={activities} />
          </div>
        ) : null}

        {activeTab === "notes" ? (
          <div className="p-5">
            <NotesPanel notes={notes} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { SubscriptionBadge } from "@/features/inbox/components/contact-sidebar/contact-section";
