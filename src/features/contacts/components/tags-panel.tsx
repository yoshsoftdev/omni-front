"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tagService } from "@/features/contacts/services/tag.service";
import { useAuthStore } from "@/store/auth-store";
import type { Tag } from "@/types/tag";

interface TagsPanelProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  onChanged: () => void;
}

export function TagsPanel({ tags, selectedTagId, onSelectTag, onChanged }: TagsPanelProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await tagService.create(name.trim());
      setName("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Tags</h2>
        <Button size="sm" variant="ghost" onClick={() => onSelectTag(null)}>
          All
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onSelectTag(tag.id)}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: selectedTagId === tag.id ? tag.color : "transparent",
              color: selectedTagId === tag.id ? "#fff" : tag.color,
              border: `1px solid ${tag.color}`,
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {canManage ? (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New tag name"
            required
          />
          <Button type="submit" size="sm" disabled={loading}>
            Add
          </Button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
