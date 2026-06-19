"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface InternalNotePanelProps {
  onSave: (content: string) => void;
}

export function InternalNotePanel({ onSave }: InternalNotePanelProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    const text = content.trim();
    if (!text) return;
    setSaving(true);
    onSave(text);
    setContent("");
    setSaving(false);
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Internal notes are visible only to workspace members.</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add an internal note..."
        className="min-h-[100px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
        rows={4}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={!content.trim() || saving}>
          Save Note
        </Button>
      </div>
    </div>
  );
}
