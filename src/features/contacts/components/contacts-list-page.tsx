"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Tag, Trash2, Upload } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-bar";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactDetailDrawer } from "@/features/contacts/components/contact-detail-drawer";
import { ContactFilterBar } from "@/features/contacts/components/contact-filter-bar";
import {
  ContactFormModal,
  contactToFormValues,
  emptyContactFormValues,
  type ContactFormValues,
} from "@/features/contacts/components/contact-form-modal";
import { ContactStatsRow } from "@/features/contacts/components/contact-stats-row";
import { ContactTable } from "@/features/contacts/components/contact-table";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { contactFieldService, contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import { runBulk } from "@/features/contacts/utils/bulk";
import { usePermission } from "@/features/team/hooks/use-permission";
import { PERM } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import type { ConsentStatus, Contact, ContactFieldDefinition, ContactStats, ContactTag } from "@/types/contact";
import { formatApiErrorMessage } from "@/services/api/errors";

export function ContactsListPage() {
  const { notify, Toast } = useToast();
  const { can } = usePermission();
  const canCreate = can(PERM.contactCreate);
  const canUpdate = can(PERM.contactUpdate);
  const canDelete = can(PERM.contactDelete);
  const canBulk = canUpdate || canDelete;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<ContactFieldDefinition[]>([]);
  const [stats, setStats] = useState<ContactStats>({ total: 0, opt_in: 0, opt_out: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [consentFilter, setConsentFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContactFormValues>(emptyContactFormValues());
  const [editForm, setEditForm] = useState<ContactFormValues>(emptyContactFormValues());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagId, setBulkTagId] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; description: string; run: () => Promise<void> } | null>(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [listResult, tagItems, statsResult, fieldDefs] = await Promise.all([
        contactService.list({
          page,
          page_size: pageSize,
          search: search.trim() || undefined,
          tag_id: tagFilter || undefined,
          consent_status: (consentFilter as ConsentStatus) || undefined,
          source: sourceFilter || undefined,
          city: cityFilter.trim() || undefined,
        }),
        tagService.list(),
        contactService.stats(),
        contactFieldService.listDefinitions(),
      ]);
      setContacts(listResult.items);
      setSelectedIds(new Set());
      setTotal(listResult.total);
      setTags(tagItems);
      setStats(statsResult);
      setFieldDefinitions(fieldDefs);
    } catch (err) {
      setLoadError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [cityFilter, consentFilter, page, pageSize, search, sourceFilter, tagFilter]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize;

  async function submitContact(values: ContactFormValues, contactId?: string) {
    if (!values.contact_name.trim() || !values.phone.trim()) {
      notify("error", "Contact name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        contact_name: values.contact_name.trim(),
        customer_name: values.customer_name.trim() || undefined,
        phone: values.phone.trim(),
        email: values.email.trim() || undefined,
        notes: values.notes.trim() || undefined,
        country: values.country.trim() || undefined,
        province: values.province.trim() || undefined,
        city: values.city.trim() || undefined,
        company: values.company.trim() || undefined,
        job_title: values.job_title.trim() || undefined,
        consent_status: values.consent_status,
        tag_ids: values.tag_ids,
        custom_fields: contactFieldService.buildCustomFieldPayload(fieldDefinitions, values.custom_fields),
      };
      const saved = contactId
        ? await contactService.update(contactId, payload)
        : await contactService.create(payload);
      await loadPage();
      if (selectedContact?.id === saved.id) {
        setSelectedContact(saved);
      }
      setAddOpen(false);
      setEditContact(null);
      setForm(emptyContactFormValues());
      notify("success", contactId ? "Contact updated" : "Contact added");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(contact: Contact) {
    setEditContact(contact);
    setEditForm(contactToFormValues(contact));
  }

  function handleDeleteContact(contact: Contact) {
    setConfirm({
      title: "Delete contact?",
      description: `"${contact.contact_name}" will be removed from your contacts.`,
      run: async () => {
        try {
          await contactService.remove(contact.id);
          if (selectedContact?.id === contact.id) setSelectedContact(null);
          await loadPage();
          notify("success", "Contact deleted");
        } catch (err) {
          notify("error", formatApiErrorMessage(err));
        }
      },
    });
  }

  function reportBulk(verb: string, result: { ok: number; failed: number }) {
    if (result.failed > 0) {
      notify("error", `${verb} ${result.ok} contacts; ${result.failed} failed. Try again for the rest.`);
    } else {
      notify("success", `${verb} ${result.ok} contacts`);
    }
  }

  async function bulkAddTag() {
    const tag = tags.find((t) => t.id === bulkTagId);
    if (!tag) return;
    setBulkBusy(true);
    try {
      const byId = new Map(contacts.map((c) => [c.id, c]));
      const result = await runBulk([...selectedIds], (id) => {
        const existing = byId.get(id)?.tags.map((t) => t.id) ?? [];
        return existing.includes(tag.id)
          ? Promise.resolve()
          : contactService.update(id, { tag_ids: [...existing, tag.id] });
      });
      reportBulk(`Tagged "${tag.name}" on`, result);
      setBulkTagId("");
      await loadPage();
    } finally {
      setBulkBusy(false);
    }
  }

  function bulkDelete() {
    const ids = [...selectedIds];
    setConfirm({
      title: `Delete ${ids.length} contacts?`,
      description: "The selected contacts will be removed from your contacts.",
      run: async () => {
        setBulkBusy(true);
        try {
          reportBulk("Deleted", await runBulk(ids, (id) => contactService.remove(id)));
          await loadPage();
        } finally {
          setBulkBusy(false);
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <Toast />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage your contact database, segments, and tags.</p>
      </div>
      <ContactsNav />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ContactFilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          sourceFilter={sourceFilter}
          onSourceChange={(v) => { setSourceFilter(v); setPage(1); }}
          tagFilter={tagFilter}
          onTagChange={(v) => { setTagFilter(v); setPage(1); }}
          tags={tags}
          onMoreFilters={() => setMoreFiltersOpen(true)}
        />
        {canCreate ? (
          <div className="flex gap-2">
            <Button onClick={() => { setForm(emptyContactFormValues()); setAddOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Contact
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contacts/import"><Upload className="mr-2 h-4 w-4" />Import Contacts</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <ContactStatsRow stats={stats} />

      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading contacts..." className="m-4" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => void loadPage()} className="m-4" />
        ) : contacts.length === 0 ? (
          <EmptyState message="No contacts found." className="m-4" />
        ) : (
          <>
            {selectedIds.size > 0 ? (
              <div
                role="toolbar"
                aria-label="Bulk actions"
                className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2 text-sm"
              >
                <span className="font-medium">{selectedIds.size} selected</span>
                {canUpdate ? (
                  <>
                    <FilterSelect
                      label="Tag to add"
                      value={bulkTagId}
                      onChange={setBulkTagId}
                      options={[{ value: "", label: "Add tag…" }, ...tags.map((t) => ({ value: t.id, label: t.name }))]}
                      className="h-9"
                    />
                    <Button size="sm" variant="outline" disabled={!bulkTagId || bulkBusy} onClick={() => void bulkAddTag()}>
                      <Tag className="h-4 w-4" />
                      Apply tag
                    </Button>
                  </>
                ) : null}
                {canDelete ? (
                  <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={bulkDelete}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </Button>
              </div>
            ) : null}
          <ContactTable
            contacts={contacts}
            selectedIds={canBulk ? selectedIds : undefined}
            onSelectionChange={canBulk ? setSelectedIds : undefined}
            onRowClick={setSelectedContact}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDeleteContact : undefined}
          />
          </>
        )}
        <PaginationFooter
          start={total === 0 ? 0 : start + 1}
          end={Math.min(start + contacts.length, total)}
          total={total}
          totalLabel="contacts"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </section>

      {selectedContact ? (
        <ContactDetailDrawer
          contact={selectedContact}
          tags={tags}
          fieldDefinitions={fieldDefinitions}
          onClose={() => setSelectedContact(null)}
          onUpdate={(updated) => {
            setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedContact(updated);
          }}
          onNotify={notify}
          onRefresh={loadPage}
          onOpenLinkedContact={(linkedContactId) => {
            void contactService.getById(linkedContactId).then((peer) => {
              setSelectedContact(peer);
              setContacts((prev) => {
                if (prev.some((c) => c.id === peer.id)) {
                  return prev.map((c) => (c.id === peer.id ? peer : c));
                }
                return prev;
              });
            }).catch((err) => {
              notify("error", formatApiErrorMessage(err));
            });
          }}
        />
      ) : null}

      {addOpen ? (
        <ContactFormModal
          title="Add Contact"
          submitLabel="Add Contact"
          values={form}
          onChange={setForm}
          tags={tags}
          fieldDefinitions={fieldDefinitions}
          onClose={() => setAddOpen(false)}
          onSubmit={() => void submitContact(form)}
          saving={saving}
        />
      ) : null}

      {editContact ? (
        <ContactFormModal
          title="Edit Contact"
          submitLabel="Save Changes"
          values={editForm}
          onChange={setEditForm}
          tags={tags}
          fieldDefinitions={fieldDefinitions}
          onClose={() => setEditContact(null)}
          onSubmit={() => void submitContact(editForm, editContact.id)}
          saving={saving}
        />
      ) : null}

      <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>More Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <FilterSelect
              label="Subscription"
              value={consentFilter}
              onChange={(v) => { setConsentFilter(v); setPage(1); }}
              options={[
                { value: "", label: "All Subscriptions" },
                { value: "opt_in", label: "Subscribed" },
                { value: "opt_out", label: "Unsubscribed" },
                { value: "unknown", label: "Unknown" },
              ]}
              className="w-full"
            />
            <div className="space-y-1.5">
              <Label htmlFor="contacts-city-filter">City</Label>
              <Input
                id="contacts-city-filter"
                placeholder="e.g. Bandung"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConsentFilter(""); setCityFilter(""); setPage(1); }}>Reset</Button>
            <Button onClick={() => setMoreFiltersOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        onConfirm={() => confirm?.run()}
        onOpenChange={(open) => !open && setConfirm(null)}
      />
    </div>
  );
}
