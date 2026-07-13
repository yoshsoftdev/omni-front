"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityMetaCard } from "@/components/shared/entity-meta-card";
import { Button } from "@/components/ui/button";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { TagFormModal } from "@/features/contacts/components/tags/tag-form-modal";
import { contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import { useToast } from "@/hooks/use-toast";
import type { Contact, ContactTag } from "@/types/contact";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function TagDetailPage({ tagId }: { tagId: string }) {
  const { notify, Toast } = useToast();
  const [tag, setTag] = useState<ContactTag | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    Promise.all([tagService.getById(tagId), contactService.list({ tag_id: tagId })])
      .then(([tagDto, contactResult]) => {
        const mapped = { ...tagDto, contact_count: contactResult.total };
        setTag(mapped);
        setName(mapped.name);
        setDescription(mapped.description);
        setContacts(contactResult.items.slice(0, 5));
      })
      .catch((err) => notify("error", err instanceof Error ? err.message : "Failed to load tag"))
      .finally(() => setLoading(false));
  }, [tagId, notify]);

  const recentContacts = useMemo(() => contacts, [contacts]);

  if (loading) {
    return <EmptyState message="Loading tag..." className="m-8" />;
  }

  if (!tag) {
    return <EmptyState message="Tag not found." className="m-8" />;
  }

  return (
    <div className="space-y-6">
      <Toast />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage your contact database, segments, and tags.</p>
      </div>
      <ContactsNav />
      <Link href="/contacts/tags" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />Back to Tags
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <ColorDot color={tag.color} className="h-4 w-4" />
          <div>
            <h2 className="text-xl font-semibold">{tag.name}</h2>
            <p className="text-sm text-muted-foreground">{tag.description || "—"}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => { setName(tag.name); setDescription(tag.description); setEditOpen(true); }}>
          <Pencil className="mr-2 h-4 w-4" />Edit Tag
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EntityMetaCard label="Contact Count" value={tag.contact_count.toLocaleString()} />
        <EntityMetaCard label="Color" value={<span className="inline-flex items-center gap-2"><ColorDot color={tag.color} className="h-3 w-3" />{tag.color}</span>} />
        <EntityMetaCard label="Created By" value={tag.created_by} />
        <EntityMetaCard label="Created At" value={formatDate(tag.created_at)} />
      </div>
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent Contacts</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/contacts?tag=${tag.id}`}>View All Contacts Using Tag<ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {recentContacts.length === 0 ? (
            <EmptyState message="No contacts found with this tag." />
          ) : (
            recentContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 rounded-lg border p-3">
                <ContactAvatar name={contact.contact_name} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{contact.contact_name}</div>
                  <div className="text-xs text-muted-foreground">{contact.phone}</div>
                </div>
                <span className="text-xs text-muted-foreground">{contact.email}</span>
              </div>
            ))
          )}
        </div>
      </section>
      <TagFormModal
        open={editOpen}
        title="Edit Tag"
        name={name}
        description={description}
        color={tag.color}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onColorChange={() => {}}
        onClose={() => setEditOpen(false)}
        onSubmit={async () => {
          try {
            const updated = await tagService.update(tag.id, name.trim(), tag.color);
            setTag({ ...tag, name: updated.name, description: description.trim(), updated_at: updated.updated_at });
            setEditOpen(false);
            notify("success", "Tag updated");
          } catch (err) {
            notify("error", err instanceof Error ? err.message : "Failed to update tag");
          }
        }}
      />
    </div>
  );
}
