"use client";

import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { AddContactForm } from "@/features/contacts/components/add-contact-form";
import { ContactsTable } from "@/features/contacts/components/contacts-table";
import { ImportContactsForm } from "@/features/contacts/components/import-contacts-form";
import { TagsPanel } from "@/features/contacts/components/tags-panel";
import { contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import { useAuthStore } from "@/store/auth-store";
import type { Contact } from "@/types/contact";
import type { Tag } from "@/types/tag";

export function ContactsPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [contactList, tagList] = await Promise.all([
        contactService.list({
          search: search.trim() || undefined,
          tag_id: selectedTagId ?? undefined,
        }),
        tagService.list(),
      ]);
      setContacts(contactList.items);
      setTags(tagList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search, selectedTagId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage contacts, tags, and imports for broadcasts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <TagsPanel
          tags={tags}
          selectedTagId={selectedTagId}
          onSelectTag={setSelectedTagId}
          onChanged={loadData}
        />

        <div className="space-y-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
          />

          {canManage ? (
            <>
              <AddContactForm tags={tags} onCreated={loadData} />
              <ImportContactsForm onImported={loadData} />
            </>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading contacts...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <ContactsTable contacts={contacts} onChanged={loadData} />
          )}
        </div>
      </div>
    </div>
  );
}
