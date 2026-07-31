"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import type { ConsentStatus, Contact, ContactFieldDefinition, ContactStats, ContactTag } from "@/types/contact";

export function ContactsListPage() {
  const { notify, Toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<ContactFieldDefinition[]>([]);
  const [stats, setStats] = useState<ContactStats>({ total: 0, opt_in: 0, opt_out: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
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

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [listResult, tagItems, statsResult, fieldDefs] = await Promise.all([
        contactService.list({
          page,
          page_size: pageSize,
          search: search.trim() || undefined,
          tag_id: tagFilter || undefined,
          consent_status: (consentFilter as ConsentStatus) || undefined,
        }),
        tagService.list(),
        contactService.stats(),
        contactFieldService.listDefinitions(),
      ]);
      let items = listResult.items;
      if (sourceFilter) {
        items = items.filter((contact) => contact.source === sourceFilter);
      }
      if (cityFilter.trim()) {
        const city = cityFilter.trim().toLowerCase();
        items = items.filter((contact) => (contact.city ?? "").toLowerCase().includes(city));
      }
      setContacts(items);
      setTotal(listResult.total);
      setTags(tagItems);
      setStats(statsResult);
      setFieldDefinitions(fieldDefs);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [cityFilter, consentFilter, notify, page, pageSize, search, sourceFilter, tagFilter]);

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
      notify("error", err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(contact: Contact) {
    setEditContact(contact);
    setEditForm(contactToFormValues(contact));
  }

  async function handleDeleteContact(contact: Contact) {
    if (!confirm(`Delete contact "${contact.contact_name}"?`)) return;
    try {
      await contactService.remove(contact.id);
      if (selectedContact?.id === contact.id) setSelectedContact(null);
      await loadPage();
      notify("success", "Contact deleted");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to delete contact");
    }
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
        <div className="flex gap-2">
          <Button onClick={() => { setForm(emptyContactFormValues()); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Contact
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contacts/import"><Upload className="mr-2 h-4 w-4" />Import Contacts</Link>
          </Button>
        </div>
      </div>

      <ContactStatsRow stats={stats} />

      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading contacts..." className="m-4" />
        ) : contacts.length === 0 ? (
          <EmptyState message="No contacts found." className="m-4" />
        ) : (
          <ContactTable
            contacts={contacts}
            onRowClick={setSelectedContact}
            onEdit={openEdit}
            onDelete={handleDeleteContact}
          />
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
              notify("error", err instanceof Error ? err.message : "Failed to open linked contact");
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

      {moreFiltersOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">More Filters</h3>
              <button type="button" onClick={() => setMoreFiltersOpen(false)}>×</button>
            </div>
            <div className="space-y-3">
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={consentFilter}
                onChange={(e) => setConsentFilter(e.target.value)}
              >
                <option value="">All Subscriptions</option>
                <option value="opt_in">Subscribed</option>
                <option value="opt_out">Unsubscribed</option>
                <option value="unknown">Unknown</option>
              </select>
              <Input placeholder="City" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setConsentFilter(""); setCityFilter(""); setPage(1); }}>Reset</Button>
              <Button onClick={() => { setMoreFiltersOpen(false); setPage(1); }}>Apply Filters</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
