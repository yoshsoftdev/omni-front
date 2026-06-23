"use client";

import { ColorDot } from "@/components/shared/color-dot";
import type { Segment } from "@/features/segments/types/segment";
import { cn } from "@/lib/utils";

export function SegmentPicker({
  segments,
  selectedIds,
  onChange,
  className,
}: {
  segments: Segment[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  if (segments.length === 0) {
    return <p className="text-sm text-muted-foreground">No segments available. Create a segment in Contacts first.</p>;
  }

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {segments.map((segment) => {
        const selected = selectedIds.includes(segment.id);
        return (
          <button
            key={segment.id}
            type="button"
            onClick={() => toggle(segment.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/40",
            )}
          >
            <input type="checkbox" readOnly checked={selected} className="mt-1" />
            <ColorDot color={segment.color} className="mt-1 h-2.5 w-2.5" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{segment.name}</div>
              <div className="text-xs text-muted-foreground">{segment.description}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {segment.contact_count.toLocaleString()} contacts
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
