"use client";

import { Send, UserPlus } from "lucide-react";
import { useState } from "react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { Button } from "@/components/ui/button";
import { ContactFormModal, emptyContactFormValues } from "@/features/contacts/components/contact-form-modal";
import type { InboxContact } from "@/features/inbox/types";
import { cn } from "@/lib/utils";
import type { ConsentStatus } from "@/types/contact";

function SubscriptionBadge({ status }: { status: InboxContact["subscription_status"] }) {
  const subscribed = status === "subscribed";
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
        subscribed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[#E5E7EB] bg-[#F6F7F9] text-[#6B7280]",
      )}
    >
      {subscribed ? "Subscribed" : "Unsubscribed"}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface ContactSectionProps {
  contact: InboxContact;
  onSendMessage: () => void;
  onToggleSubscription: () => void;
  onSaveContact?: (input: {
    contact_name: string;
    customer_name?: string;
    phone: string;
    email?: string;
    consent_status?: ConsentStatus;
  }) => Promise<void>;
}

export function ContactSection({
  contact,
  onSendMessage,
  onToggleSubscription,
  onSaveContact,
}: ContactSectionProps) {
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyContactFormValues());
  const isUnsaved = contact.is_saved_contact === false;

  async function handleSaveContact() {
    if (!onSaveContact || !form.contact_name.trim()) return;
    setSaving(true);
    try {
      await onSaveContact({
        contact_name: form.contact_name.trim(),
        customer_name: form.customer_name.trim() || undefined,
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
    <>
      <div className="border-b border-[#E5E7EB] px-5 py-5 text-center dark:border-border">
        <ContactAvatar
          name={contact.contact_name || contact.name}
          src={contact.avatar_url}
          size="lg"
          className="mx-auto h-16 w-16 text-base"
        />
        <h3 className="mt-3 text-base font-semibold text-[#111111] dark:text-foreground">
          {contact.contact_name || contact.name}
        </h3>
        {contact.customer_name && contact.customer_name !== contact.contact_name ? (
          <p className="text-xs text-[#6B7280]">Customer: {contact.customer_name}</p>
        ) : null}
        <p className="text-sm text-[#6B7280]">{contact.phone}</p>
        {contact.email ? <p className="text-xs text-[#6B7280]">{contact.email}</p> : null}
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
                ...emptyContactFormValues(),
                phone: contact.phone,
                email: contact.email ?? "",
              });
              setAddContactOpen(true);
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Contact
          </Button>
        ) : null}
      </div>

      <section className="space-y-6 p-5" aria-labelledby="contact-heading">
        <div>
          <h4
            id="contact-heading"
            className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]"
          >
            Contact
          </h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[#6B7280]">Source</dt>
              <dd className="font-medium">{contact.source}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#6B7280]">Added On</dt>
              <dd className="font-medium">{formatDate(contact.added_on)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#6B7280]">Last Activity</dt>
              <dd className="font-medium">{formatDate(contact.last_activity)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#6B7280]">Language</dt>
              <dd className="font-medium">{contact.language}</dd>
            </div>
          </dl>
        </div>

        {(contact.customer_type || contact.city || contact.notes) && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Custom Fields
            </h4>
            <dl className="space-y-2 text-sm">
              {contact.customer_type ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#6B7280]">Customer Type</dt>
                  <dd className="font-medium">{contact.customer_type}</dd>
                </div>
              ) : null}
              {contact.city ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#6B7280]">City</dt>
                  <dd className="font-medium">{contact.city}</dd>
                </div>
              ) : null}
              {contact.notes ? (
                <div>
                  <dt className="text-[#6B7280]">Notes</dt>
                  <dd className="mt-1 font-medium">{contact.notes}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        )}

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Statistics
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F6F7F9] px-3 py-2.5 dark:border-border dark:bg-muted/30">
              <p className="text-xs text-[#6B7280]">Conversations</p>
              <p className="text-lg font-semibold">{contact.conversations_count}</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F6F7F9] px-3 py-2.5 dark:border-border dark:bg-muted/30">
              <p className="text-xs text-[#6B7280]">Campaigns Received</p>
              <p className="text-lg font-semibold">{contact.campaigns_received}</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F6F7F9] px-3 py-2.5 dark:border-border dark:bg-muted/30">
              <p className="text-xs text-[#6B7280]">Campaigns Clicked</p>
              <p className="text-lg font-semibold">{contact.campaigns_clicked}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button size="sm" className="w-full gap-1.5" onClick={onSendMessage}>
            <Send className="h-3.5 w-3.5" />
            Send Message
          </Button>
          {!isUnsaved ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={onToggleSubscription}
            >
              Change Subscription Status
            </Button>
          ) : null}
        </div>
      </section>

      {addContactOpen ? (
        <ContactFormModal
          title="Add Contact"
          submitLabel="Save Contact"
          values={form}
          onChange={setForm}
          tags={[]}
          fieldDefinitions={[]}
          onClose={() => setAddContactOpen(false)}
          onSubmit={() => void handleSaveContact()}
          phoneReadOnly
          saving={saving}
        />
      ) : null}
    </>
  );
}

export { SubscriptionBadge };
