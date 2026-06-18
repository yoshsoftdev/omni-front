"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { TagFormModal, TAG_COLORS } from "@/features/contacts/components/tags/tag-form-modal";
import { TagTable } from "@/features/contacts/components/tags/tag-table";
import { MOCK_TAGS } from "@/features/contacts/mock-data";
import { useToast } from "@/hooks/use-toast";
import type { ContactTag } from "@/types/contact";

export function TagsListPage() {
  const { notify, Toast } = useToast();
  const [tags, setTags] = useState<ContactTag[]>(MOCK_TAGS);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const sorted = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags]);

  function handleCreate() {
    if (!name.trim()) return notify("error", "Tag name is required");
    const now = new Date().toISOString();
    setTags((prev) => [{ id: `t-${Date.now()}`, name: name.trim(), description: description.trim(), color, contact_count: 0, updated_at: now, created_at: now, created_by: "Steven Fernandes" }, ...prev]);
    setCreateOpen(false);
    setName("");
    setDescription("");
    notify("success", "Tag created");
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
        <TagTable tags={sorted} onDelete={(id) => { if (confirm("Delete tag?")) { setTags((p) => p.filter((t) => t.id !== id)); notify("success", "Tag deleted"); } }} onMore={() => notify("success", "More actions")} />
      </section>
      <TagFormModal open={createOpen} title="Create Tag" name={name} description={description} color={color} onNameChange={setName} onDescriptionChange={setDescription} onColorChange={setColor} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} submitLabel="Create" />
    </div>
  );
}
