"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface MessageComposerProps {
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
}

export function MessageComposer({ disabled, onSend }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = content.trim();
    if (!text) return;

    setError(null);
    setLoading(true);
    try {
      await onSend(text);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-card p-3">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a reply..."
          disabled={disabled || loading}
          className="min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
        />
        <Button type="submit" disabled={disabled || loading || !content.trim()}>
          {loading ? "..." : "Send"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
