"use client";

import type { InboxWorkspaceNote } from "@/features/inbox/types";

const NOTE_CATEGORIES = [
  { key: "workspace" as const, label: "Workspace Notes" },
  { key: "internal" as const, label: "Internal Notes" },
  { key: "supervisor" as const, label: "Supervisor Notes" },
];

interface NotesPanelProps {
  notes: InboxWorkspaceNote[];
}

export function NotesPanel({ notes }: NotesPanelProps) {
  return (
    <div className="space-y-5">
      {NOTE_CATEGORIES.map((category) => {
        const categoryNotes = notes.filter((n) => n.category === category.key);
        return (
          <section key={category.key} aria-labelledby={`notes-${category.key}`}>
            <h4
              id={`notes-${category.key}`}
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {category.label}
            </h4>
            {categoryNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notes yet.</p>
            ) : (
              <div className="space-y-2">
                {categoryNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border bg-background p-3 dark:bg-muted/30"
                  >
                    <p className="text-sm text-foreground">{note.content}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {note.author} · {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
