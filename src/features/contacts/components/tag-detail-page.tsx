"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { EntityMetaCard } from "@/components/shared/entity-meta-card";
import { Button } from "@/components/ui/button";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { TagFormModal } from "@/features/contacts/components/tags/tag-form-modal";
import { MOCK_CONTACTS, MOCK_TAGS } from "@/features/contacts/mock-data";
import { useToast } from "@/hooks/use-toast";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function TagDetailPage({ tagId }: { tagId: string }) {
  const { notify, Toast } = useToast();
  const initial = MOCK_TAGS.find((t) => t.id === tagId) ?? MOCK_TAGS[0];
  const [tag, setTag] = useState({ ...initial });
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(tag.name);
  const [description, setDescription] = useState(tag.description);
  const recentContacts = useMemo(() => MOCK_CONTACTS.filter((c) => c.tags.some((t) => t.id === tag.id)).slice(0, 5), [tag.id]);

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
            <p className="text-sm text-muted-foreground">{tag.description}</p>
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
          {recentContacts.map((contact) => (
            <div key={contact.id} className="flex items-center gap-3 rounded-lg border p-3">
              <ContactAvatar name={contact.name} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{contact.name}</div>
                <div className="text-xs text-muted-foreground">{contact.phone}</div>
              </div>
              <span className="text-xs text-muted-foreground">{contact.email}</span>
            </div>
          ))}
        </div>
      </section>
      <TagFormModal open={editOpen} title="Edit Tag" name={name} description={description} color={tag.color} onNameChange={setName} onDescriptionChange={setDescription} onColorChange={() => {}} onClose={() => setEditOpen(false)} onSubmit={() => { setTag({ ...tag, name: name.trim(), description: description.trim(), updated_at: new Date().toISOString() }); setEditOpen(false); notify("success", "Tag updated"); }} />
    </div>
  );
}
