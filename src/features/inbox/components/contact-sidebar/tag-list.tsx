"use client";

import { Plus } from "lucide-react";

import { TagBadgeList } from "@/components/shared/tag-badge";
import type { InboxTag } from "@/features/inbox/types";

interface TagListProps {
  tags: InboxTag[];
  onAddTag?: () => void;
}

export function TagList({ tags, onAddTag }: TagListProps) {
  return (
    <section aria-labelledby="tags-heading">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 id="tags-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tags
        </h4>
        {onAddTag ? (
          <button
            type="button"
            onClick={onAddTag}
            className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground dark:hover:bg-muted"
            aria-label="Add tag"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {tags.length > 0 ? (
        <TagBadgeList tags={tags} />
      ) : (
        <p className="text-xs text-muted-foreground">No tags</p>
      )}
    </section>
  );
}
