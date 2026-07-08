"use client";

import { FileText, Image as ImageIcon, Paperclip, Smile, X, Zap } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { InternalNotePanel } from "@/features/inbox/components/internal-note-panel";
import { QuickReplySelector } from "@/features/inbox/components/quick-reply-selector";
import { formatBytes } from "@/features/inbox/hooks/use-authenticated-media";
import { storageService } from "@/features/inbox/services/storage.service";
import type { QuickReplyItem } from "@/features/inbox/types";
import { cn } from "@/lib/utils";
import { formatApiErrorMessage } from "@/services/api/errors";

type ComposerTab = "reply" | "note";

export interface ComposerSendInput {
  content: string;
  storageObjectId?: string;
  replyToMessageId?: string;
}

interface PendingAttachment {
  file: File;
  previewUrl?: string;
  storageObjectId?: string;
  uploading: boolean;
  error?: string;
}

interface MessageComposerProps {
  quickReplies: QuickReplyItem[];
  sending?: boolean;
  replyTo?: {
    id: string;
    sender_name?: string;
    content: string;
  } | null;
  onCancelReply?: () => void;
  onSend: (input: ComposerSendInput) => void | Promise<void>;
  onSaveNote: (content: string) => void;
}

export function MessageComposer({
  quickReplies,
  sending = false,
  replyTo,
  onCancelReply,
  onSend,
  onSaveNote,
}: MessageComposerProps) {
  const [activeTab, setActiveTab] = useState<ComposerTab>("reply");
  const [content, setContent] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    setUploadError(null);
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setAttachment({ file, previewUrl, uploading: true });
    try {
      const stored = await storageService.upload(file);
      setAttachment({
        file,
        previewUrl,
        storageObjectId: stored.id,
        uploading: false,
      });
    } catch (err) {
      setAttachment({
        file,
        previewUrl,
        uploading: false,
        error: formatApiErrorMessage(err),
      });
      setUploadError(formatApiErrorMessage(err));
    }
  }

  function clearAttachment() {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    setUploadError(null);
  }

  async function handleSend() {
    const text = content.trim();
    if (sending || attachment?.uploading) return;
    if (!text && !attachment?.storageObjectId) return;
    if (attachment?.error) return;
    await onSend({
      content: text,
      storageObjectId: attachment?.storageObjectId,
      replyToMessageId: replyTo?.id,
    });
    setContent("");
    clearAttachment();
  }

  function insertTemplate(text: string) {
    setContent((prev) => (prev ? `${prev}\n${text}` : text));
  }

  const canSend = Boolean((content.trim() || attachment?.storageObjectId) && !attachment?.uploading && !attachment?.error);

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
          {replyTo ? (
            <div className="mb-3 rounded-md border bg-muted/30 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Replying to {replyTo.sender_name?.trim() || "message"}
                  </p>
                  <p className="line-clamp-2 whitespace-pre-wrap text-xs">{replyTo.content || "(no text)"}</p>
                </div>
                <button type="button" onClick={onCancelReply} className="rounded-md p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
          {attachment ? (
            <div className="mb-3 rounded-md border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {attachment.previewUrl ? (
                    <img src={attachment.previewUrl} alt={attachment.file.name} className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{attachment.file.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(attachment.file.size)}</div>
                    {attachment.uploading ? (
                      <div className="text-xs text-muted-foreground">Uploading...</div>
                    ) : null}
                    {attachment.error ? <div className="text-xs text-destructive">{attachment.error}</div> : null}
                  </div>
                </div>
                <button type="button" onClick={clearAttachment} className="rounded-md p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
          {uploadError && !attachment ? <p className="mb-2 text-xs text-destructive">{uploadError}</p> : null}

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
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,video/mp4,video/3gpp,audio/*,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file);
              event.currentTarget.value = "";
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Image"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                title="Document"
                onClick={() => documentInputRef.current?.click()}
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
            <Button size="sm" onClick={() => void handleSend()} disabled={!canSend || sending}>
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
