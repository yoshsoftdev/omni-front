"use client";

import { FileText, Image as ImageIcon, Paperclip, Smile, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { InternalNotePanel } from "@/features/inbox/components/internal-note-panel";
import { getFilteredQuickReplies, QuickReplySelector } from "@/features/inbox/components/quick-reply-selector";
import { formatBytes } from "@/features/inbox/hooks/use-authenticated-media";
import { storageService } from "@/features/inbox/services/storage.service";
import type { InboxChannel, QuickReplyItem } from "@/features/inbox/types";
import {
  findActiveSlashToken,
  replaceSlashToken,
} from "@/features/inbox/utils/quick-reply-slash";
import {
  formatQuickReplyToday,
  resolveQuickReplyVariables,
  type QuickReplyVariableContext,
} from "@/features/inbox/utils/quick-reply-variables";
import { cn } from "@/lib/utils";
import { formatApiErrorMessage } from "@/services/api/errors";
import { useAuthStore } from "@/store/auth-store";

type ComposerTab = "reply" | "note";

export interface ComposerSendInput {
  content: string;
  storageObjectId?: string;
  attachment?: {
    storage_object_id: string;
    mime_type: string;
    size_bytes: number;
    filename: string;
  };
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
  channel?: InboxChannel;
  quickReplies: QuickReplyItem[];
  quickReplyContext?: Pick<QuickReplyVariableContext, "customer_name" | "phone">;
  replyTo?: {
    id: string;
    sender_name?: string;
    content: string;
  } | null;
  onCancelReply?: () => void;
  onSend: (input: ComposerSendInput) => void;
  onSaveNote: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageComposer({
  channel = "whatsapp",
  quickReplies,
  quickReplyContext,
  replyTo,
  onCancelReply,
  onSend,
  onSaveNote,
  onTypingStart,
  onTypingStop,
}: MessageComposerProps) {
  const user = useAuthStore((state) => state.user);
  const team = useAuthStore((state) => state.team);
  const isInstagramChannel = channel === "instagram";
  const mediaAccept = isInstagramChannel
    ? "image/jpeg,image/png,video/mp4,video/quicktime,video/webm,video/ogg,audio/aac,audio/mp4,audio/mpeg,audio/wav,application/pdf"
    : "image/jpeg,image/png,video/mp4,video/3gpp,audio/*,application/pdf";
  const documentAccept = isInstagramChannel
    ? "application/pdf"
    : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const fileAccept = isInstagramChannel ? mediaAccept : undefined;
  const [activeTab, setActiveTab] = useState<ComposerTab>("reply");
  const [content, setContent] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashToken, setSlashToken] = useState<ReturnType<typeof findActiveSlashToken>>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingStartTimerRef = useRef<number | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const variableContext = useMemo<QuickReplyVariableContext>(
    () => ({
      customer_name: quickReplyContext?.customer_name ?? "",
      phone: quickReplyContext?.phone ?? "",
      agent_name: user?.name ?? "",
      company_name: team?.name ?? "",
      today: formatQuickReplyToday(),
    }),
    [quickReplyContext?.customer_name, quickReplyContext?.phone, team?.name, user?.name],
  );

  const filteredSlashItems = useMemo(
    () => getFilteredQuickReplies(quickReplies, slashQuery),
    [quickReplies, slashQuery],
  );

  const resolveTemplate = useCallback(
    (text: string) => resolveQuickReplyVariables(text, variableContext),
    [variableContext],
  );

  useEffect(() => {
    return () => {
      if (typingStartTimerRef.current != null) window.clearTimeout(typingStartTimerRef.current);
      if (typingStopTimerRef.current != null) window.clearTimeout(typingStopTimerRef.current);
      if (isTypingRef.current) onTypingStop?.();
    };
  }, [onTypingStop]);

  useEffect(() => {
    if (!slashOpen) {
      setHighlightedIndex(0);
      return;
    }
    setHighlightedIndex((current) => {
      if (filteredSlashItems.length === 0) return 0;
      return Math.min(current, filteredSlashItems.length - 1);
    });
  }, [filteredSlashItems.length, slashOpen]);

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

  function scheduleTypingStop() {
    if (typingStopTimerRef.current != null) {
      window.clearTimeout(typingStopTimerRef.current);
    }
    typingStopTimerRef.current = window.setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop?.();
      }
    }, 3000);
  }

  function updateSlashState(value: string, cursor: number) {
    const token = findActiveSlashToken(value, cursor);
    if (token) {
      setSlashOpen(true);
      setSlashQuery(token.query);
      setSlashToken(token);
      setTemplateOpen(false);
      return;
    }
    setSlashOpen(false);
    setSlashQuery("");
    setSlashToken(null);
  }

  function handleContentChange(value: string, cursor = value.length) {
    setContent(value);
    updateSlashState(value, cursor);
    if (!value.trim()) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop?.();
      }
      return;
    }
    if (typingStartTimerRef.current != null) {
      window.clearTimeout(typingStartTimerRef.current);
    }
    typingStartTimerRef.current = window.setTimeout(() => {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart?.();
      }
      scheduleTypingStop();
    }, 300);
  }

  function handleSend() {
    const text = content.trim();
    if (attachment?.uploading) return;
    if (!text && !attachment?.storageObjectId) return;
    if (attachment?.error) return;

    const payload: ComposerSendInput = {
      content: text,
      storageObjectId: attachment?.storageObjectId,
      attachment:
        attachment?.storageObjectId
          ? {
              storage_object_id: attachment.storageObjectId,
              mime_type: attachment.file.type,
              size_bytes: attachment.file.size,
              filename: attachment.file.name,
            }
          : undefined,
      replyToMessageId: replyTo?.id,
    };

    setContent("");
    setSlashOpen(false);
    setSlashQuery("");
    setSlashToken(null);
    clearAttachment();
    onCancelReply?.();
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
    }
    onSend(payload);
  }

  function insertTemplate(text: string) {
    const resolved = resolveTemplate(text);
    setContent((prev) => (prev ? `${prev}\n${resolved}` : resolved));
  }

  function insertSlashReply(text: string) {
    const resolved = resolveTemplate(text);
    if (!slashToken) {
      setContent((prev) => (prev ? `${prev}\n${resolved}` : resolved));
      setSlashOpen(false);
      return;
    }
    const { nextValue, nextCursor } = replaceSlashToken(content, slashToken, resolved);
    setContent(nextValue);
    setSlashOpen(false);
    setSlashQuery("");
    setSlashToken(null);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function selectHighlightedSlashReply() {
    const item = filteredSlashItems[highlightedIndex];
    if (!item) return;
    insertSlashReply(item.text);
  }

  const canSend = Boolean((content.trim() || attachment?.storageObjectId) && !attachment?.uploading && !attachment?.error);

  return (
    <div className="border-t bg-card">
      <div className="flex gap-1 border-b px-2">
        <button
          type="button"
          onClick={() => setActiveTab("reply")}
          className={cn(
            "px-3 py-2.5 text-sm font-medium transition-colors",
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
            "px-3 py-2.5 text-sm font-medium transition-colors",
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

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => handleContentChange(event.target.value, event.target.selectionStart ?? event.target.value.length)}
              onClick={(event) => updateSlashState(content, event.currentTarget.selectionStart ?? content.length)}
              onKeyUp={(event) => updateSlashState(content, event.currentTarget.selectionStart ?? content.length)}
              onKeyDown={(event) => {
                if (slashOpen) {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightedIndex((current) =>
                      filteredSlashItems.length === 0 ? 0 : (current + 1) % filteredSlashItems.length,
                    );
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightedIndex((current) =>
                      filteredSlashItems.length === 0
                        ? 0
                        : (current - 1 + filteredSlashItems.length) % filteredSlashItems.length,
                    );
                    return;
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setSlashOpen(false);
                    setSlashQuery("");
                    setSlashToken(null);
                    return;
                  }
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    selectHighlightedSlashReply();
                    return;
                  }
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isInstagramChannel ? "Type your Instagram message..." : "Type your message..."}
              className="min-h-[72px] w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
            />
            <QuickReplySelector
              items={quickReplies}
              open={slashOpen}
              mode="slash"
              filterQuery={slashQuery}
              highlightedIndex={highlightedIndex}
              onClose={() => {
                setSlashOpen(false);
                setSlashQuery("");
                setSlashToken(null);
              }}
              onSelect={insertSlashReply}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
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
            accept={mediaAccept}
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
            accept={documentAccept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file);
              event.currentTarget.value = "";
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <>
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
              </>
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
                  onClick={() => {
                    setTemplateOpen((value) => !value);
                    setSlashOpen(false);
                  }}
                >
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Template
                </button>
                <QuickReplySelector
                  items={quickReplies}
                  open={templateOpen}
                  mode="button"
                  onClose={() => setTemplateOpen(false)}
                  onSelect={insertTemplate}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleSend} disabled={!canSend}>
              Send
            </Button>
          </div>
        </div>
      ) : (
        <InternalNotePanel onSave={onSaveNote} />
      )}
    </div>
  );
}
