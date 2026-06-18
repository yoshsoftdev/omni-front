"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit3, MessageSquare, Plus, Tag } from "lucide-react";

import { ConsentBadge, consentLabel } from "@/components/shared/consent-badge";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { RightDrawer, RightDrawerBody, RightDrawerHeader, RightDrawerTabs } from "@/components/shared/right-drawer";
import { sourceLabel } from "@/components/shared/source-icon";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import { ContactTimeline } from "@/features/contacts/components/contact-timeline";
import type { Contact, ContactTag, ConsentStatus } from "@/types/contact";

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ContactDetailDrawer({
  contact,
  tags,
  onClose,
  onUpdate,
  onNotify,
}: {
  contact: Contact;
  tags: ContactTag[];
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
  onNotify: (type: "success" | "error", message: string) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("details");
  const [consentOpen, setConsentOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [notes, setNotes] = useState(contact.notes ?? "");

  function changeConsent(status: ConsentStatus) {
    onUpdate({ ...contact, consent_status: status, updated_at: new Date().toISOString() });
    setConsentOpen(false);
    onNotify("success", "Consent status updated");
  }

  function addTag(tagId: string) {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag || contact.tags.some((t) => t.id === tagId)) return;
    onUpdate({
      ...contact,
      tags: [...contact.tags, { id: tag.id, name: tag.name, color: tag.color }],
      updated_at: new Date().toISOString(),
    });
    setTagOpen(false);
    onNotify("success", `Tag "${tag.name}" added`);
  }

  function saveNotes() {
    onUpdate({ ...contact, notes, updated_at: new Date().toISOString() });
    onNotify("success", "Notes saved");
  }

  const footer = (
    <div className="space-y-2">
      <Button className="w-full" onClick={() => { router.push("/inbox"); onNotify("success", "Opening inbox..."); }}>
        <MessageSquare className="mr-2 h-4 w-4" />
        Send Message
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setTagOpen(true)}>
          <Tag className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
        <Button variant="outline" onClick={() => setConsentOpen(true)}>Change Consent</Button>
      </div>
    </div>
  );

  return (
    <>
      <RightDrawer open onClose={onClose} footer={footer}>
        <RightDrawerHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <ContactAvatar name={contact.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{contact.name}</h3>
                <ConsentBadge status={contact.consent_status} />
              </div>
              <p className="text-sm text-muted-foreground">{contact.phone}</p>
              <p className="text-xs text-muted-foreground">{contact.email}</p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto"><Edit3 className="h-4 w-4" /></Button>
          </div>
          <RightDrawerTabs
            tabs={[
              { value: "details", label: "Details" },
              { value: "activity", label: "Activity" },
              { value: "notes", label: "Notes" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </RightDrawerHeader>

        <RightDrawerBody>
          {tab === "details" ? (
            <div className="space-y-5">
              <section>
                <h4 className="text-sm font-semibold">Basic Information</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span>{sourceLabel(contact.source)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Added On</span><span>{formatDate(contact.created_at)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Activity</span><span>{formatDateTime(contact.last_activity_at)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span>{contact.language ?? "—"}</span></div>
                </div>
              </section>
              <section>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Tags</h4>
                  <Button variant="ghost" size="sm" onClick={() => setTagOpen(true)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="mt-2"><TagBadgeList tags={contact.tags} /></div>
              </section>
              <section>
                <h4 className="text-sm font-semibold">Custom Fields</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Customer Type</span><span>{contact.customer_type ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{contact.city ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="max-w-[200px] text-right">{contact.notes || "—"}</span></div>
                </div>
              </section>
              <section className="rounded-lg border p-3">
                <h4 className="text-sm font-semibold">Consent Status</h4>
                <p className="mt-1 text-xs text-muted-foreground">{consentLabel(contact.consent_status)}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setConsentOpen(true)}>Update Status</Button>
              </section>
              <section>
                <h4 className="text-sm font-semibold">Statistics</h4>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-semibold">{contact.conversations_count}</div>
                    <div className="text-xs text-muted-foreground">Conversations</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-2xl font-semibold">{contact.campaigns_received}</div>
                    <div className="text-xs text-muted-foreground">Campaigns Received</div>
                  </div>
                  <div className="col-span-2 rounded-lg border p-3 text-center">
                    <div className="text-2xl font-semibold">{contact.campaigns_clicked}</div>
                    <div className="text-xs text-muted-foreground">Campaigns Clicked</div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
          {tab === "activity" ? <ContactTimeline activities={contact.activities ?? []} /> : null}
          {tab === "notes" ? (
            <div className="space-y-3">
              <textarea
                className="min-h-[200px] w-full rounded-md border bg-background p-3 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this contact..."
              />
              <Button className="w-full" onClick={saveNotes}>Save Notes</Button>
            </div>
          ) : null}
        </RightDrawerBody>
      </RightDrawer>

      {consentOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-5">
            <h4 className="font-semibold">Change Consent Status</h4>
            <div className="mt-3 space-y-2">
              {(["opt_in", "opt_out", "unknown"] as ConsentStatus[]).map((s) => (
                <button key={s} type="button" className="flex w-full items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent" onClick={() => changeConsent(s)}>
                  <span>{consentLabel(s)}</span>
                  <ConsentBadge status={s} />
                </button>
              ))}
            </div>
            <Button variant="outline" className="mt-3 w-full" onClick={() => setConsentOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {tagOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-5">
            <h4 className="font-semibold">Add Tag</h4>
            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
              {tags.filter((t) => !contact.tags.some((ct) => ct.id === t.id)).map((t) => (
                <button key={t.id} type="button" className="flex w-full items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent" onClick={() => addTag(t.id)}>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </button>
              ))}
            </div>
            <Button variant="outline" className="mt-3 w-full" onClick={() => setTagOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
