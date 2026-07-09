"use client";

import { Check, CheckCheck, CornerUpLeft, Download, FileText, Image as ImageIcon, MoreHorizontal, Trash2, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  downloadAuthenticatedMedia,
  formatBytes,
  useAuthenticatedMediaUrl,
} from "@/features/inbox/hooks/use-authenticated-media";
import type { InboxChatMessage } from "@/features/inbox/types";
import { normalizeWamidForMatch } from "@/features/inbox/utils/wamid";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function AuthenticatedImage({ objectId, alt }: { objectId: string; alt: string }) {
  const { url, loading } = useAuthenticatedMediaUrl(objectId);
  const [open, setOpen] = useState(false);

  if (loading) return <div className="text-xs text-muted-foreground">Loading image...</div>;
  if (!url) return <div className="text-xs text-muted-foreground">Image unavailable</div>;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block overflow-hidden rounded-md">
        <img src={url} alt={alt} className="max-h-48 w-full object-cover" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <img src={url} alt={alt} className="max-h-[90vh] max-w-full rounded-md object-contain" />
        </div>
      ) : null}
    </>
  );
}

function AuthenticatedVideo({ objectId }: { objectId: string }) {
  const { url, loading } = useAuthenticatedMediaUrl(objectId);
  if (loading) return <div className="text-xs text-muted-foreground">Loading video...</div>;
  if (!url) return <div className="text-xs text-muted-foreground">Video unavailable</div>;
  return <video src={url} controls className="max-h-48 w-full rounded-md" />;
}

function AuthenticatedAudio({ objectId }: { objectId: string }) {
  const { url, loading } = useAuthenticatedMediaUrl(objectId);
  if (loading) return <div className="text-xs text-muted-foreground">Loading audio...</div>;
  if (!url) return <div className="text-xs text-muted-foreground">Audio unavailable</div>;
  return <audio src={url} controls className="w-full" />;
}

function DocumentAttachment({
  objectId,
  filename,
  sizeBytes,
}: {
  objectId: string;
  filename: string;
  sizeBytes: number;
}) {
  return (
    <button
      type="button"
      onClick={() => void downloadAuthenticatedMedia(objectId, filename)}
      className="flex w-full items-center gap-2 rounded-md bg-black/5 p-2 text-left hover:bg-black/10"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{filename}</span>
        <span className="text-xs text-muted-foreground">{formatBytes(sizeBytes)}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function MediaPreview({ message }: { message: InboxChatMessage }) {
  const attachment = message.attachment;

  if (message.type === "image" && attachment?.storage_object_id) {
    return (
      <div className="space-y-2">
        <AuthenticatedImage objectId={attachment.storage_object_id} alt={attachment.filename} />
        {message.content ? <p className="whitespace-pre-wrap text-sm">{message.content}</p> : null}
      </div>
    );
  }

  if (message.type === "video" && attachment?.storage_object_id) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="h-4 w-4" />
          <span>{attachment.filename}</span>
        </div>
        <AuthenticatedVideo objectId={attachment.storage_object_id} />
        {message.content ? <p className="whitespace-pre-wrap text-sm">{message.content}</p> : null}
      </div>
    );
  }

  if (message.type === "audio" && attachment?.storage_object_id) {
    return (
      <div className="space-y-2">
        <AuthenticatedAudio objectId={attachment.storage_object_id} />
        {message.content ? <p className="whitespace-pre-wrap text-sm">{message.content}</p> : null}
      </div>
    );
  }

  if (message.type === "document" && attachment?.storage_object_id) {
    return (
      <div className="space-y-2">
        <DocumentAttachment
          objectId={attachment.storage_object_id}
          filename={attachment.filename}
          sizeBytes={attachment.size_bytes}
        />
        {message.content ? <p className="whitespace-pre-wrap text-sm">{message.content}</p> : null}
      </div>
    );
  }

  if (message.type === "image") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-black/5 p-2">
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm">{message.content}</span>
      </div>
    );
  }
  if (message.type === "video") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-black/5 p-2">
        <Video className="h-4 w-4" />
        <span className="text-sm">{message.content}</span>
      </div>
    );
  }
  if (message.type === "document") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-black/5 p-2">
        <FileText className="h-4 w-4" />
        <span className="text-sm">{message.content}</span>
      </div>
    );
  }
  if (message.type === "template") {
    return (
      <div className="text-sm">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Template
        </span>
        {message.content}
      </div>
    );
  }
  return <p className="whitespace-pre-wrap text-sm">{message.content}</p>;
}

interface MessageBubbleProps {
  message: InboxChatMessage;
  repliedTo?: {
    id: string;
    content: string;
  };
  highlighted?: boolean;
  onJumpToMessage?: (id: string) => void;
  onReply?: (message: InboxChatMessage) => void;
  onDelete?: (message: InboxChatMessage) => void;
}

export function MessageBubble({ message, repliedTo, highlighted = false, onJumpToMessage, onReply, onDelete }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";
  const isFromWABusinessApp = message.source === "wa_business_app";
  const [actionsOpen, setActionsOpen] = useState(false);
  const hasUnresolvedReply = Boolean(message.reply_to_wamid && !repliedTo);

  return (
    <div className={cn("group flex w-full flex-col", isOutbound ? "items-end" : "items-start")}>
      <div
        className={cn(
          "relative w-fit max-w-[90%] rounded-2xl px-3.5 py-2.5 shadow-sm transition-all",
          isOutbound
            ? "rounded-br-md bg-emerald-100 text-foreground"
            : "rounded-bl-md border bg-background",
          highlighted ? "ring-2 ring-amber-400" : "",
        )}
      >
        <div className={cn("absolute top-1.5", isOutbound ? "left-1.5" : "right-1.5")}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((prev) => !prev)}
              className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100 focus-visible:opacity-100"
              title="Message actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {actionsOpen ? (
              <div className={cn("absolute z-10 mt-1 min-w-28 rounded-md border bg-background p-1 shadow-md", isOutbound ? "left-0" : "right-0")}>
                <button
                  type="button"
                  onClick={() => {
                    // #region agent log
                    fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
                      body: JSON.stringify({
                        sessionId: "d8bb7a",
                        runId: "run1",
                        hypothesisId: "H1",
                        location: "message-bubble.tsx:reply-action",
                        message: "Reply action clicked",
                        data: { messageId: message.id, wamid: message.wamid ?? null, isDeleted: Boolean(message.is_deleted) },
                        timestamp: Date.now(),
                      }),
                    }).catch(() => {});
                    // #endregion
                    setActionsOpen(false);
                    onReply?.(message);
                  }}
                  disabled={!message.wamid}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CornerUpLeft className="h-3.5 w-3.5" />
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // #region agent log
                    fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
                      body: JSON.stringify({
                        sessionId: "d8bb7a",
                        runId: "run1",
                        hypothesisId: "H2",
                        location: "message-bubble.tsx:delete-action",
                        message: "Delete action clicked",
                        data: { messageId: message.id, wamid: message.wamid ?? null, isDeleted: Boolean(message.is_deleted) },
                        timestamp: Date.now(),
                      }),
                    }).catch(() => {});
                    // #endregion
                    setActionsOpen(false);
                    onDelete?.(message);
                  }}
                  disabled={message.is_deleted}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-destructive hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {repliedTo ? (
          <button
            type="button"
            onClick={() => onJumpToMessage?.(repliedTo.id)}
            className="mb-2 block w-full rounded-md border-l-2 border-emerald-500 bg-black/5 px-2 py-1 text-left text-xs text-muted-foreground hover:bg-black/10"
            title="Jump to replied message"
          >
            <p className="line-clamp-2 whitespace-pre-wrap">{repliedTo.content}</p>
          </button>
        ) : hasUnresolvedReply ? (
          <div
            className="mb-2 rounded-md border-l-2 border-amber-500 bg-black/5 px-2 py-1 text-left text-xs text-muted-foreground"
            title="Original replied message is not available in loaded app history"
          >
            <p className="line-clamp-2 whitespace-pre-wrap italic">Reply to an earlier message (not available in app history)</p>
          </div>
        ) : null}
        {message.is_deleted ? (
          <p className="text-sm italic text-muted-foreground">This message was deleted</p>
        ) : (
          <MediaPreview message={message} />
        )}
        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-[10px] text-muted-foreground",
            isOutbound ? "justify-end" : "justify-start",
          )}
        >
          <span>{formatTime(message.sent_at)}</span>
          {isOutbound ? (
            message.read ? (
              <CheckCheck className="h-3 w-3 text-blue-500" />
            ) : message.delivered ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          ) : null}
        </div>
      </div>
      {isOutbound && message.sender_name && !isFromWABusinessApp ? (
        <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
          — {message.sender_name}
        </p>
      ) : null}
      {isOutbound && isFromWABusinessApp ? (
        <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
          via WA Business App
        </p>
      ) : null}
    </div>
  );
}

interface MessageThreadProps {
  messages: InboxChatMessage[];
  onReply?: (message: InboxChatMessage) => void;
  onDelete?: (message: InboxChatMessage) => void;
}

export function MessageThread({ messages, onReply, onDelete }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  let lastLabel = "";
  const byWAMID = new Map<string, { id: string; content: string }>();
  for (const msg of messages) {
    const key = normalizeWamidForMatch(msg.wamid);
    if (key) {
      byWAMID.set(key, { id: msg.id, content: msg.content });
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
      block: "end",
    });
  }, [messages]);

  function jumpToMessage(id: string) {
    const el = document.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(id);
    window.setTimeout(() => setHighlightedMessageId((prev) => (prev === id ? null : prev)), 1800);
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        messages.map((message) => {
          const showLabel = message.date_label && message.date_label !== lastLabel;
          if (message.date_label) lastLabel = message.date_label;
          const repliedTo =
            (message.reply_to_message_id
              ? messages.find((m) => m.id === message.reply_to_message_id)
              : undefined) ??
            (message.reply_to_wamid
              ? byWAMID.get(normalizeWamidForMatch(message.reply_to_wamid))
              : undefined);

          return (
            <div key={message.id} data-message-id={message.id}>
              {showLabel ? (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] text-muted-foreground">
                    {message.date_label}
                  </span>
                </div>
              ) : null}
              <MessageBubble
                message={message}
                repliedTo={repliedTo}
                highlighted={highlightedMessageId === message.id}
                onJumpToMessage={jumpToMessage}
                onReply={onReply}
                onDelete={onDelete}
              />
            </div>
          );
        })
      )}
      <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
    </div>
  );
}
