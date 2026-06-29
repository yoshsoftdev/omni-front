"use client";

import { TagBadgeList } from "@/components/shared/tag-badge";
import type { ContactTag } from "@/types/contact";

export function ContactTagSelector({
  tags,
  selectedIds,
  onChange,
}: {
  tags: ContactTag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(tagId: string) {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
      return;
    }
    onChange([...selectedIds, tagId]);
  }

  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">No tags available yet.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <TagBadgeList
          tags={tags
            .filter((tag) => selectedIds.includes(tag.id))
            .map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }))}
        />
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
        {tags.map((tag) => {
          const checked = selectedIds.includes(tag.id);
          return (
            <label
              key={tag.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(tag.id)}
                className="rounded border"
              />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
              <span>{tag.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
