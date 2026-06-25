"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Upload } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactDetailDrawer } from "@/features/contacts/components/contact-detail-drawer";
import { ContactFilterBar } from "@/features/contacts/components/contact-filter-bar";
import { ContactFormModal } from "@/features/contacts/components/contact-form-modal";
import { ContactStatsRow } from "@/features/contacts/components/contact-stats-row";
import { ContactTable } from "@/features/contacts/components/contact-table";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import { useToast } from "@/hooks/use-toast";
import type { Contact, ConsentStatus, CreateContactInput, ContactStats, ContactTag } from "@/types/contact";

const emptyForm: CreateContactInput = { name: "", phone: "", email: "", consent_status: "unknown" };

export function ContactsListPage() {
  const { notify, Toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [consentFilter, setConsentFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateContactInput>(emptyForm);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    consent_status: "unknown" as ConsentStatus,
  });

  async function loadContacts() {
    setLoading(true);
    try {
      const [contactItems, tagItems] = await Promise.all([contactService.list(), tagService.list()]);
      setContacts(contactItems);
      setTags(tagItems);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, [notify]);

  const stats = useMemo<ContactStats>(() => ({
    total: contacts.length,
    opt_in: contacts.filter((c) => c.consent_status === "opt_in").length,
    opt_out: contacts.filter((c) => c.consent_status === "opt_out").length,
    unknown: contacts.filter((c) => c.consent_status === "unknown").length,
  }), [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      const bySearch = q ? c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? "").toLowerCase().includes(q) : true;
      const bySource = sourceFilter ? c.source === sourceFilter : true;
      const byTag = tagFilter ? c.tags.some((t) => t.id === tagFilter) : true;
      const byConsent = consentFilter ? c.consent_status === consentFilter : true;
      const byCity = cityFilter ? (c.city ?? "").toLowerCase().includes(cityFilter.toLowerCase()) : true;
      return bySearch && bySource && byTag && byConsent && byCity;
    });
  }, [contacts, search, sourceFilter, tagFilter, consentFilter, cityFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  async function handleAddContact() {
    if (!form.name.trim() || !form.phone.trim()) return notify("error", "Name and phone are required");
    setSaving(true);
    try {
      const created = await contactService.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim(),
        consent_status: form.consent_status ?? "unknown",
        source: "manual",
      });
      setContacts((prev) => [created, ...prev]);
      setAddOpen(false);
      setForm(emptyForm);
      notify("success", "Contact added");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(contact: Contact) {
    setEditContact(contact);
    setEditForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email ?? "",
      consent_status: contact.consent_status,
    });
  }

  async function handleEditContact() {
    if (!editContact) return;
    if (!editForm.name.trim() || !editForm.phone.trim()) return notify("error", "Name and phone are required");

    setSaving(true);
    try {
      const updated = await contactService.update(editContact.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        consent_status: editForm.consent_status,
      });
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedContact?.id === updated.id) setSelectedContact(updated);
      setEditContact(null);
      notify("success", "Contact updated");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to update contact");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContact(contact: Contact) {
    if (!confirm(`Delete contact "${contact.name}"?`)) return;
    try {
      await contactService.remove(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      if (selectedContact?.id === contact.id) setSelectedContact(null);
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
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Contact</Button>
          <Button variant="outline" asChild><Link href="/contacts/import"><Upload className="mr-2 h-4 w-4" />Import Contacts</Link></Button>
        </div>
      </div>

      <ContactStatsRow stats={stats} />

      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading contacts..." className="m-4" />
        ) : paged.length === 0 ? (
          <EmptyState message="No contacts found." className="m-4" />
        ) : (
          <ContactTable
            contacts={paged}
            onRowClick={setSelectedContact}
            onEdit={openEdit}
            onDelete={handleDeleteContact}
          />
        )}
        <PaginationFooter
          start={total === 0 ? 0 : start + 1}
          end={Math.min(start + pageSize, total)}
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
          onClose={() => setSelectedContact(null)}
          onUpdate={(updated) => {
            setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedContact(updated);
          }}
          onNotify={notify}
        />
      ) : null}

      {addOpen ? (
        <ContactFormModal
          title="Add Contact"
          submitLabel="Add Contact"
          values={{
            name: form.name,
            phone: form.phone,
            email: form.email ?? "",
            consent_status: form.consent_status ?? "unknown",
          }}
          onChange={(values) => setForm({
            name: values.name,
            phone: values.phone,
            email: values.email,
            consent_status: values.consent_status,
          })}
          onClose={() => setAddOpen(false)}
          onSubmit={() => void handleAddContact()}
          saving={saving}
        />
      ) : null}

      {editContact ? (
        <ContactFormModal
          title="Edit Contact"
          submitLabel="Save Changes"
          values={editForm}
          onChange={setEditForm}
          onClose={() => setEditContact(null)}
          onSubmit={() => void handleEditContact()}
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
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={consentFilter} onChange={(e) => setConsentFilter(e.target.value)}>
                <option value="">All Consent</option>
                <option value="opt_in">Marketing Opt-In</option>
                <option value="opt_out">Marketing Opt-Out</option>
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
