"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { TagFormModal, TAG_COLORS } from "@/features/contacts/components/tags/tag-form-modal";
import { TagTable } from "@/features/contacts/components/tags/tag-table";
import { tagService } from "@/features/contacts/services/tag.service";
import { useToast } from "@/hooks/use-toast";
import type { ContactTag } from "@/types/contact";

export function TagsListPage() {
  const { notify, Toast } = useToast();
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const sorted = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags]);

  useEffect(() => {
    tagService
      .list()
      .then(setTags)
      .catch((err) => notify("error", err instanceof Error ? err.message : "Failed to load tags"))
      .finally(() => setLoading(false));
  }, [notify]);

  async function handleCreate() {
    if (!name.trim()) return notify("error", "Tag name is required");
    try {
      const created = await tagService.create(name.trim(), color);
      setTags((prev) => [created, ...prev]);
      setCreateOpen(false);
      setName("");
      setDescription("");
      notify("success", "Tag created");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to create tag");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tags</h2>
          <p className="text-sm text-muted-foreground">Manual labels assigned to contacts.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Tag</Button>
      </div>
      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading tags..." className="m-4" />
        ) : sorted.length === 0 ? (
          <EmptyState message="No tags found." className="m-4" />
        ) : (
          <TagTable tags={sorted} onDelete={async (id) => { if (confirm("Delete tag?")) { await tagService.remove(id); setTags((p) => p.filter((t) => t.id !== id)); notify("success", "Tag deleted"); } }} onMore={() => notify("success", "More actions")} />
        )}
      </section>
      <TagFormModal open={createOpen} title="Create Tag" name={name} description={description} color={color} onNameChange={setName} onDescriptionChange={setDescription} onColorChange={setColor} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} submitLabel="Create" />
    </div>
  );
}
