"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { QuickReplyItem } from "@/features/inbox/types";
import { filterQuickReplies } from "@/features/inbox/utils/quick-reply-slash";
import { cn } from "@/lib/utils";

interface QuickReplySelectorProps {
  items: QuickReplyItem[];
  open: boolean;
  mode?: "button" | "slash";
  filterQuery?: string;
  highlightedIndex?: number;
  onClose: () => void;
  onSelect: (text: string) => void;
}

export function QuickReplySelector({
  items,
  open,
  mode = "button",
  filterQuery,
  highlightedIndex = 0,
  onClose,
  onSelect,
}: QuickReplySelectorProps) {
  const [search, setSearch] = useState("");
  const activeQuery = mode === "slash" ? (filterQuery ?? "") : search;

  const filteredItems = useMemo(
    () => filterQuickReplies(items, activeQuery),
    [activeQuery, items],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, QuickReplyItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  let itemIndex = -1;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40" onClick={onClose} aria-label="Close" />
      <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-lg border bg-card shadow-lg">
        {mode === "button" ? (
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates..."
                className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="border-b px-3 py-2 text-xs text-muted-foreground">
            Quick replies{activeQuery ? ` matching "/${activeQuery}"` : ""}
          </div>
        )}
        <div className="max-h-64 overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No templates found.</p>
          ) : (
            grouped.map(([category, categoryItems]) => (
              <div key={category} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </p>
                {categoryItems.map((item) => {
                  itemIndex += 1;
                  const isHighlighted = itemIndex === highlightedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "w-full rounded-md px-2 py-2 text-left text-xs hover:bg-accent",
                        isHighlighted && "bg-accent",
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(item.text);
                        onClose();
                        setSearch("");
                      }}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export function getFilteredQuickReplies(items: QuickReplyItem[], query: string) {
  return filterQuickReplies(items, query);
}
