"use client";

import { FileText, Image as ImageIcon, Paperclip, Smile, Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { InternalNotePanel } from "@/features/inbox/components/internal-note-panel";
import { QuickReplySelector } from "@/features/inbox/components/quick-reply-selector";
import type { QuickReplyItem } from "@/features/inbox/types";
import { cn } from "@/lib/utils";

type ComposerTab = "reply" | "note";

interface MessageComposerProps {
  quickReplies: QuickReplyItem[];
  sending?: boolean;
  onSend: (content: string) => void | Promise<void>;
  onSaveNote: (content: string) => void;
}

export function MessageComposer({ quickReplies, sending = false, onSend, onSaveNote }: MessageComposerProps) {
  const [activeTab, setActiveTab] = useState<ComposerTab>("reply");
  const [content, setContent] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);

  async function handleSend() {
    const text = content.trim();
    if (!text || sending) return;
    await onSend(text);
    setContent("");
  }

  function insertTemplate(text: string) {
    setContent((prev) => (prev ? `${prev}\n${text}` : text));
  }

  return (
    <div className="border-t bg-card">
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("reply")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium",
            activeTab === "reply"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Reply
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("note")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium",
            activeTab === "note"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Internal Note
        </button>
      </div>

      {activeTab === "reply" ? (
        <div className="p-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type your message..."
            className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Image"
              >
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Document"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Emoji"
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-muted"
                  onClick={() => setTemplateOpen((v) => !v)}
                >
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Template
                </button>
                <QuickReplySelector
                  items={quickReplies}
                  open={templateOpen}
                  onClose={() => setTemplateOpen(false)}
                  onSelect={insertTemplate}
                />
              </div>
            </div>
            <Button size="sm" onClick={() => void handleSend()} disabled={!content.trim() || sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      ) : (
        <InternalNotePanel onSave={onSaveNote} />
      )}
    </div>
  );
}
