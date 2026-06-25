"use client";

import { Plus, Send, UserPlus } from "lucide-react";
import { useState } from "react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import { ContactFormModal } from "@/features/contacts/components/contact-form-modal";
import { ContactTimeline } from "@/features/inbox/components/contact-timeline";
import type { InboxActivityEvent, InboxContact, InboxWorkspaceNote } from "@/features/inbox/types";
import { cn } from "@/lib/utils";
import type { ConsentStatus } from "@/types/contact";

type SidebarTab = "details" | "activity" | "notes";

function SubscriptionBadge({ status }: { status: InboxContact["subscription_status"] }) {
  const subscribed = status === "subscribed";
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
        subscribed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600",
      )}
    >
      {subscribed ? "Subscribed" : "Unsubscribed"}
    </span>
  );
}

interface ContactSidebarProps {
  contact: InboxContact | null;
  activities: InboxActivityEvent[];
  notes: InboxWorkspaceNote[];
  onSendMessage: () => void;
  onAddTag: () => void;
  onToggleSubscription: () => void;
  onSaveContact?: (input: { name: string; phone: string; email?: string; consent_status?: ConsentStatus }) => Promise<void>;
}

export function ContactSidebar({
  contact,
  activities,
  notes,
  onSendMessage,
  onAddTag,
  onToggleSubscription,
  onSaveContact,
}: ContactSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("details");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    consent_status: "unknown" as ConsentStatus,
  });

  if (!contact) {
    return (
      <div className="flex h-full w-[420px] shrink-0 items-center justify-center border-l bg-card text-sm text-muted-foreground">
        Select a conversation to view contact details.
      </div>
    );
  }

  const isUnsaved = contact.is_saved_contact === false;

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "activity", label: "Activity" },
    { id: "notes", label: "Notes" },
  ];

  const noteCategories = [
    { key: "workspace" as const, label: "Workspace Notes" },
    { key: "internal" as const, label: "Internal Notes" },
    { key: "supervisor" as const, label: "Supervisor Notes" },
  ];

  async function handleSaveContact() {
    if (!contact || !onSaveContact || !form.name.trim()) return;
    setSaving(true);
    try {
      await onSaveContact({
        name: form.name.trim(),
        phone: form.phone.trim() || contact.phone,
        email: form.email.trim() || undefined,
        consent_status: form.consent_status,
      });
      setAddContactOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l bg-card">
      <div className="border-b px-5 py-5 text-center">
        <ContactAvatar name={contact.name} size="lg" className="mx-auto h-16 w-16 text-base" />
        <h3 className="mt-3 text-base font-semibold">{contact.name}</h3>
        <p className="text-sm text-muted-foreground">{contact.phone}</p>
        {contact.email ? <p className="text-xs text-muted-foreground">{contact.email}</p> : null}
        <div className="mt-2 flex justify-center">
          {isUnsaved ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
              Not in contacts
            </span>
          ) : (
            <SubscriptionBadge status={contact.subscription_status} />
          )}
        </div>
        {isUnsaved ? (
          <Button
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => {
              setForm({
                name: "",
                phone: contact.phone,
                email: contact.email ?? "",
                consent_status: "unknown",
              });
              setAddContactOpen(true);
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Contact
          </Button>
        ) : null}
      </div>

      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {activeTab === "details" ? (
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                About Contact
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="font-medium">{contact.source}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Added On</dt>
                  <dd className="font-medium">{contact.added_on}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Last Activity</dt>
                  <dd className="font-medium">{contact.last_activity}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Language</dt>
                  <dd className="font-medium">{contact.language}</dd>
                </div>
              </dl>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</h4>
                <button type="button" onClick={onAddTag} className="rounded p-0.5 hover:bg-muted">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {contact.tags.length > 0 ? (
                <TagBadgeList tags={contact.tags} />
              ) : (
                <p className="text-xs text-muted-foreground">No tags</p>
              )}
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Custom Fields
              </h4>
              <dl className="space-y-2 text-sm">
                {contact.customer_type ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Customer Type</dt>
                    <dd className="font-medium">{contact.customer_type}</dd>
                  </div>
                ) : null}
                {contact.city ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">City</dt>
                    <dd className="font-medium">{contact.city}</dd>
                  </div>
                ) : null}
                {contact.notes ? (
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="mt-1 font-medium">{contact.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Statistics
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Conversations</p>
                  <p className="text-lg font-semibold">{contact.conversations_count}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Campaigns Received</p>
                  <p className="text-lg font-semibold">{contact.campaigns_received}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Campaigns Clicked</p>
                  <p className="text-lg font-semibold">{contact.campaigns_clicked}</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <Button size="sm" className="w-full gap-1.5" onClick={onSendMessage}>
                <Send className="h-3.5 w-3.5" />
                Send Message
              </Button>
              {!isUnsaved ? (
                <>
                  <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onAddTag}>
                    <Plus className="h-3.5 w-3.5" />
                    Add Tag
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={onToggleSubscription}
                  >
                    Change Subscription Status
                  </Button>
                </>
              ) : null}
            </section>
          </div>
        ) : null}

        {activeTab === "activity" ? <ContactTimeline events={activities} /> : null}

        {activeTab === "notes" ? (
          <div className="space-y-5">
            {noteCategories.map((category) => {
              const categoryNotes = notes.filter((n) => n.category === category.key);
              return (
                <section key={category.key}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {category.label}
                  </h4>
                  {categoryNotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryNotes.map((note) => (
                        <div key={note.id} className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-sm">{note.content}</p>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {note.author} · {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : null}
      </div>

      {addContactOpen ? (
        <ContactFormModal
          title="Add Contact"
          submitLabel="Save Contact"
          values={form}
          onChange={setForm}
          onClose={() => setAddContactOpen(false)}
          onSubmit={() => void handleSaveContact()}
          phoneReadOnly
          saving={saving}
        />
      ) : null}
    </div>
  );
}

export { SubscriptionBadge };
