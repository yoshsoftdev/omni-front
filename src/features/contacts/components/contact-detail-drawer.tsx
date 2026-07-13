"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit3, MessageSquare, Plus, Tag } from "lucide-react";

import { ConsentBadge, consentLabel } from "@/components/shared/consent-badge";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { RightDrawer, RightDrawerBody, RightDrawerHeader, RightDrawerTabs } from "@/components/shared/right-drawer";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import { ContactCustomFieldsReadOnly } from "@/features/contacts/components/contact-custom-fields-form";
import {
  ContactFormModal,
  contactToFormValues,
  type ContactFormValues,
} from "@/features/contacts/components/contact-form-modal";
import { ContactMetadataPanel } from "@/features/contacts/components/contact-metadata-panel";
import { ContactTimeline } from "@/features/contacts/components/contact-timeline";
import { contactFieldService, contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import type { Contact, ContactFieldDefinition, ContactTag, ConsentStatus } from "@/types/contact";

export function ContactDetailDrawer({
  contact,
  tags,
  fieldDefinitions,
  onClose,
  onUpdate,
  onNotify,
  onRefresh,
}: {
  contact: Contact;
  tags: ContactTag[];
  fieldDefinitions: ContactFieldDefinition[];
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
  onNotify: (type: "success" | "error", message: string) => void;
  onRefresh?: () => Promise<void>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("details");
  const [consentOpen, setConsentOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [editForm, setEditForm] = useState<ContactFormValues>(contactToFormValues(contact));
  const [detail, setDetail] = useState(contact);

  useEffect(() => {
    setDetail(contact);
    setNotes(contact.notes ?? "");
    setEditForm(contactToFormValues(contact));
    void contactService.getById(contact.id)
      .then((full) => {
        setDetail(full);
        setNotes(full.notes ?? "");
        setEditForm(contactToFormValues(full));
        onUpdate(full);
      })
      .catch(() => undefined);
  }, [contact.id]);

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

  const mergedCustomFields = contactFieldService.mergeDefinitionsWithValues(fieldDefinitions, detail);

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
            <ContactAvatar name={detail.contact_name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{detail.contact_name}</h3>
                <ConsentBadge status={detail.consent_status} />
              </div>
              {detail.customer_name && detail.customer_name !== detail.contact_name ? (
                <p className="text-xs text-muted-foreground">Customer: {detail.customer_name}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">{detail.phone}</p>
              <p className="text-xs text-muted-foreground">{detail.email ?? "No email"}</p>
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
                <h4 className="text-sm font-semibold">Profile</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4" data-segment-field="company">
                    <span className="text-muted-foreground">Company</span>
                    <span>{detail.company ?? "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4" data-segment-field="job_title">
                    <span className="text-muted-foreground">Job Title</span>
                    <span>{detail.job_title ?? "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4" data-segment-field="country">
                    <span className="text-muted-foreground">Country</span>
                    <span>{detail.country ?? "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4" data-segment-field="province">
                    <span className="text-muted-foreground">Province</span>
                    <span>{detail.province ?? "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4" data-segment-field="city">
                    <span className="text-muted-foreground">City</span>
                    <span>{detail.city ?? "—"}</span>
                  </div>
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

              <section>
                <h4 className="text-sm font-semibold">Custom Fields</h4>
                <div className="mt-3">
                  <ContactCustomFieldsReadOnly fields={mergedCustomFields} />
                </div>
              </section>

              <ContactMetadataPanel contact={detail} />

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
    </>
  );
}
