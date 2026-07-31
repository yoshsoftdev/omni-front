"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Edit3, MessageSquare, Plus, Tag } from "lucide-react";

import { ConsentBadge, consentLabel } from "@/components/shared/consent-badge";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ProviderBadge } from "@/components/shared/provider-badge";
import { RightDrawer, RightDrawerBody, RightDrawerHeader, RightDrawerTabs } from "@/components/shared/right-drawer";
import { SourceIcon, sourceLabel } from "@/components/shared/source-icon";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import { ContactCustomFieldsReadOnly } from "@/features/contacts/components/contact-custom-fields-form";
import { ContactChannels } from "@/features/contacts/components/contact-channels";
import {
  ContactFormModal,
  contactToFormValues,
  type ContactFormValues,
} from "@/features/contacts/components/contact-form-modal";
import { ContactTimeline } from "@/features/contacts/components/contact-timeline";
import { LinkContactDialog } from "@/features/contacts/components/link-contact-dialog";
import { LinkedContactsSection } from "@/features/contacts/components/linked-contacts-section";
import { contactFieldService, contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import type {
  Contact,
  ContactFieldDefinition,
  ContactSource,
  ContactTag,
  ConsentStatus,
  ProviderKind,
} from "@/types/contact";

function formatDateTime(date?: string) {
  if (!date) return "—";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function profileTimezone(contact: Contact) {
  for (const profile of contact.providers ?? []) {
    const timezone = profile.metadata?.timezone ?? profile.metadata?.time_zone;
    if (typeof timezone === "string" && timezone.trim()) return timezone;
  }
  return undefined;
}

function sourceProvider(source: ContactSource): ProviderKind | undefined {
  if (source === "whatsapp" || source === "meta_inbound") return "whatsapp";
  if (source === "ig") return "instagram";
  return undefined;
}

export function ContactDetailDrawer({
  contact,
  tags,
  fieldDefinitions,
  onClose,
  onUpdate,
  onNotify,
  onRefresh,
  onOpenLinkedContact,
}: {
  contact: Contact;
  tags: ContactTag[];
  fieldDefinitions: ContactFieldDefinition[];
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
  onNotify: (type: "success" | "error", message: string) => void;
  onRefresh?: () => Promise<void>;
  onOpenLinkedContact?: (linkedContactId: string) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [consentOpen, setConsentOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [editForm, setEditForm] = useState<ContactFormValues>(contactToFormValues(contact));
  const [detail, setDetail] = useState(contact);
  const [linkOpen, setLinkOpen] = useState(false);
  const contactRef = useRef(contact);
  const onUpdateRef = useRef(onUpdate);
  contactRef.current = contact;
  onUpdateRef.current = onUpdate;

  const refreshDetail = useCallback(async () => {
    const [full, activities] = await Promise.all([
      contactService.getById(contact.id),
      contactService.listActivities(contact.id),
    ]);
    const enriched = { ...full, activities };
    setDetail(enriched);
    setNotes(enriched.notes ?? "");
    setEditForm(contactToFormValues(enriched));
    onUpdateRef.current(enriched);
  }, [contact.id]);

  useEffect(() => {
    const selected = contactRef.current;
    setDetail(selected);
    setNotes(selected.notes ?? "");
    setEditForm(contactToFormValues(selected));
    void refreshDetail().catch(() => undefined);
  }, [contact.id, refreshDetail]);

  async function changeConsent(status: ConsentStatus) {
    setSaving(true);
    try {
      const updated = await contactService.update(contact.id, { consent_status: status });
      onUpdate(updated);
      setConsentOpen(false);
      onNotify("success", "Subscription updated");
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Failed to update marketing status");
    } finally {
      setSaving(false);
    }
  }

  async function addTag(tagId: string) {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag || contact.tags.some((t) => t.id === tagId)) return;

    setSaving(true);
    try {
      await tagService.assignToContact(tag.id, contact.id);
      const updated = await contactService.getById(contact.id);
      onUpdate(updated);
      setTagOpen(false);
      onNotify("success", `Tag "${tag.name}" added`);
      await onRefresh?.();
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Failed to add tag");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    try {
      const updated = await contactService.update(contact.id, { notes });
      onUpdate(updated);
      onNotify("success", "Notes saved");
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editForm.contact_name.trim() || !editForm.phone.trim()) {
      onNotify("error", "Contact name and phone are required");
      return;
    }

    setSaving(true);
    try {
      const updated = await contactService.update(contact.id, {
        contact_name: editForm.contact_name.trim(),
        customer_name: editForm.customer_name.trim() || undefined,
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        country: editForm.country.trim() || undefined,
        province: editForm.province.trim() || undefined,
        city: editForm.city.trim() || undefined,
        company: editForm.company.trim() || undefined,
        job_title: editForm.job_title.trim() || undefined,
        consent_status: editForm.consent_status,
        tag_ids: editForm.tag_ids,
        custom_fields: contactFieldService.buildCustomFieldPayload(fieldDefinitions, editForm.custom_fields),
      });
      onUpdate(updated);
      setEditOpen(false);
      onNotify("success", "Contact updated");
      await onRefresh?.();
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Failed to update contact");
    } finally {
      setSaving(false);
    }
  }

  const mergedCustomFields = contactFieldService
    .mergeDefinitionsWithValues(fieldDefinitions, detail)
    .filter((field) => field.value !== null && field.value !== "");
  const ownProfiles = (detail.providers ?? []).filter(
    (profile) => profile.contact_id === detail.id,
  );
  const mainProfile = ownProfiles.find((profile) => profile.is_source_of_truth);
  const contactSourceProvider = sourceProvider(detail.source);
  const sourceProfile = contactSourceProvider
    ? ownProfiles.find((profile) => profile.provider === contactSourceProvider)
    : undefined;
  const contactAvatar = sourceProfile?.avatar_url
    || ownProfiles.find((profile) => profile.avatar_url)?.avatar_url
    || detail.avatar_url;
  const linkedAccountCount = detail.linked_contacts?.length ?? 0;
  const timezone = profileTimezone(detail);

  const footer = (
    <div className="space-y-2">
      <Button
        className="w-full"
        onClick={() => {
          router.push(`/inbox?contact=${contact.id}`);
          onNotify("success", "Opening inbox...");
        }}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Send Message
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setTagOpen(true)} disabled={saving}>
          <Tag className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
        <Button variant="outline" onClick={() => setConsentOpen(true)} disabled={saving}>
          Change Subscription
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <RightDrawer open onClose={onClose} footer={footer}>
        <RightDrawerHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <ContactAvatar name={detail.contact_name} src={contactAvatar} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{detail.contact_name}</h3>
                <ConsentBadge status={detail.consent_status} />
              </div>
              {detail.customer_name && detail.customer_name !== detail.contact_name ? (
                <p className="text-xs text-muted-foreground">Customer: {detail.customer_name}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">{detail.phone || "—"}</p>
              <p className="text-xs text-muted-foreground">{detail.email ?? "—"}</p>
              {contactSourceProvider ? (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[11px] font-medium text-muted-foreground">
                    Contact source:
                  </span>
                  <ProviderBadge provider={contactSourceProvider} />
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                  <span className="font-medium text-muted-foreground">Contact source:</span>
                  <SourceIcon source={detail.source} className="h-3.5 w-3.5" />
                  <span>{sourceLabel(detail.source)}</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setEditForm(contactToFormValues(detail));
                setEditOpen(true);
              }}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          <RightDrawerTabs
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "profile", label: "Profile" },
              { value: "activity", label: "Activity" },
              { value: "notes", label: "Notes" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </RightDrawerHeader>

        <RightDrawerBody>
          {tab === "overview" ? (
            <section>
              <h4 className="text-sm font-semibold">Customer Summary</h4>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Customer Name</span>
                  <span className="text-right">{detail.customer_name || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Main Account</span>
                  {mainProfile ? (
                    <ProviderBadge provider={mainProfile.provider} />
                  ) : (
                    <span>Not Available</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Assigned Agent</span>
                  <span>Not Available</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Conversation Status</span>
                  <span>Not Available</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Linked Contacts</span>
                  <span>{linkedAccountCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">First Contact</span>
                  <span className="text-right">{formatDateTime(detail.created_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="text-right">{formatDateTime(detail.last_activity_at)}</span>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "profile" ? (
            <div className="space-y-5">
              <ContactChannels
                profiles={ownProfiles}
                onRefresh={refreshDetail}
              />

              <LinkedContactsSection
                contactId={detail.id}
                linkedContacts={detail.linked_contacts ?? []}
                onLink={() => setLinkOpen(true)}
                onOpenContact={(linkedContactId) => {
                  if (onOpenLinkedContact) {
                    onOpenLinkedContact(linkedContactId);
                    return;
                  }
                  router.push(`/contacts?contact=${linkedContactId}`);
                }}
                onRefresh={refreshDetail}
              />

              {detail.email || detail.language || timezone ? (
                <section>
                  <h4 className="text-sm font-semibold">Identity</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.email ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Email</span>
                        <span className="break-all text-right">{detail.email}</span>
                      </div>
                    ) : null}
                    {detail.language ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Language</span>
                        <span>{detail.language}</span>
                      </div>
                    ) : null}
                    {timezone ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Timezone</span>
                        <span>{timezone}</span>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section>
                <h4 className="text-sm font-semibold">Custom Fields</h4>
                <div className="mt-3">
                  <ContactCustomFieldsReadOnly fields={mergedCustomFields} />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Tags</h4>
                  <Button variant="ghost" size="sm" onClick={() => setTagOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2"><TagBadgeList tags={detail.tags} /></div>
              </section>

              <section className="rounded-lg border p-3">
                <h4 className="text-sm font-semibold">Subscription</h4>
                <p className="mt-1 text-xs text-muted-foreground">{consentLabel(detail.consent_status)}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setConsentOpen(true)}>
                  Update Subscription
                </Button>
              </section>
            </div>
          ) : null}

          {tab === "activity" ? (
            <ContactTimeline activities={detail.activities ?? []} />
          ) : null}

          {tab === "notes" ? (
            <div className="space-y-3">
              {!notes.trim() ? (
                <p className="text-sm text-muted-foreground">No notes.</p>
              ) : null}
              <textarea
                className="min-h-[200px] w-full rounded-md border bg-background p-3 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this contact..."
              />
              <Button className="w-full" onClick={saveNotes} disabled={saving}>
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          ) : null}
        </RightDrawerBody>
      </RightDrawer>

      {consentOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-5">
            <h4 className="font-semibold">Change Subscription</h4>
            <div className="mt-3 space-y-2">
              {(["opt_in", "opt_out", "unknown"] as ConsentStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent disabled:opacity-50"
                  onClick={() => void changeConsent(s)}
                  disabled={saving}
                >
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
              {tags.filter((t) => !contact.tags.some((ct) => ct.id === t.id)).length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags available to add.</p>
              ) : (
                tags.filter((t) => !contact.tags.some((ct) => ct.id === t.id)).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent disabled:opacity-50"
                    onClick={() => void addTag(t.id)}
                    disabled={saving}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                ))
              )}
            </div>
            <Button variant="outline" className="mt-3 w-full" onClick={() => setTagOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <ContactFormModal
          title="Edit Contact"
          submitLabel="Save Changes"
          values={editForm}
          onChange={setEditForm}
          tags={tags}
          fieldDefinitions={fieldDefinitions}
          onClose={() => setEditOpen(false)}
          onSubmit={() => void saveEdit()}
          saving={saving}
        />
      ) : null}
      {linkOpen ? (
        <LinkContactDialog
          target={detail}
          onClose={() => setLinkOpen(false)}
          onLinked={refreshDetail}
        />
      ) : null}
    </>
  );
}
