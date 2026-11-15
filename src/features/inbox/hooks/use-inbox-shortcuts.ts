"use client";

import { useEffect, useRef } from "react";

/** Id of the conversation `step` places away from `selectedId` in `ids`, or null at either end. */
export function adjacentId(ids: string[], selectedId: string | null, step: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const index = selectedId ? ids.indexOf(selectedId) : -1;
  if (index === -1) return step === 1 ? ids[0] : null;
  return ids[index + step] ?? null;
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  const tag = el?.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(el?.isContentEditable);
}

/**
 * Inbox keyboard shortcuts:
 * `/` search · `j`/`k` next/previous conversation · `r` reply (focus composer) · `Esc` handled by `onEscape`.
 */
export function useInboxShortcuts({
  orderedIds,
  selectedId,
  onSelect,
  onEscape,
}: {
  orderedIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Return true when Escape was handled. */
  onEscape: () => boolean;
}) {
  // Read the latest values from the listener without re-binding it on every list change.
  const latest = useRef({ orderedIds, selectedId, onSelect, onEscape });
  useEffect(() => {
    latest.current = { orderedIds, selectedId, onSelect, onEscape };
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { orderedIds, selectedId, onSelect, onEscape } = latest.current;
      if (event.key === "Escape") {
        if (onEscape()) event.preventDefault();
        return;
      }
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("inbox-search")?.focus();
      } else if (event.key === "j" || event.key === "k") {
        const next = adjacentId(orderedIds, selectedId, event.key === "j" ? 1 : -1);
        if (next) {
          event.preventDefault();
          onSelect(next);
        }
      } else if (event.key === "r" && selectedId) {
        event.preventDefault();
        document.getElementById("inbox-composer")?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
