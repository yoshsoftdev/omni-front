"use client";

import { Check, CheckCheck, CornerUpLeft, Download, ExternalLink, FileText, Image as ImageIcon, Loader2, MoreHorizontal, Trash2, Video, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, forwardRef } from "react";

import { AuthenticatedAudio } from "@/features/inbox/components/authenticated-audio";
import {
  downloadAuthenticatedMedia,
  formatBytes,
  useAuthenticatedMediaUrl,
} from "@/features/inbox/hooks/use-authenticated-media";
import type { InboxChannel, InboxChatMessage } from "@/features/inbox/types";
import { bubbleClass } from "@/features/inbox/utils/channel-bubble";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function parseInstagramShareContent(content: string): { label: string; title: string; url: string } {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const urlIndex = lines.findIndex((line) => /^https?:\/\//i.test(line));
  const url = urlIndex >= 0 ? lines[urlIndex] : "";
  const rest = urlIndex >= 0 ? lines.filter((_, index) => index !== urlIndex) : lines;
  return {
    label: rest[0] ?? "",
    title: rest.slice(1).join("\n"),
    url,
  };
}

function isInstagramShareContent(content: string): boolean {
  return (
    content === "Mentioned your story" ||
    content === "Replied to a story" ||
    content === "Shared a reel" ||
    content === "Shared a post" ||
    content === "Shared a story" ||
    content === "Link" ||
    content.startsWith("Shared a post\n") ||
    content.startsWith("Shared a reel\n") ||
    content.startsWith("Link\n")
  );
}

function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function InstagramOGLinkCard({ content }: { content: string }) {
  const { label, title, url } = parseInstagramShareContent(content);
  const isStory =
    label === "Mentioned your story" ||
    label === "Replied to a story" ||
    label === "Shared a story";

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-72 overflow-hidden rounded-md border bg-muted/40 text-left transition-colors hover:bg-muted/70"
      >
        <div className="space-y-1 px-2.5 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {isStory ? <Video className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
            {label || "Instagram link"}
          </span>
          {title ? <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p> : null}
          <span className="block truncate text-xs text-sky-700 dark:text-sky-400">{linkHost(url)}</span>
        </div>
      </a>
    );
  }

  return (
    <div className="rounded-md border bg-muted/40 px-2.5 py-2 text-sm text-foreground">
      <span className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {isStory ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
        {label || "Instagram event"}
      </span>
      {title ? <p className="whitespace-pre-wrap text-sm">{title}</p> : null}
    </div>
  );
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
    const caption = message.content.trim();
    const showCaption =
      caption !== "" &&
      !["audio", "voice note"].includes(caption.toLowerCase()) &&
      caption.toLowerCase() !== attachment.filename.trim().toLowerCase();

    return (
      <div className="space-y-2">
        <AuthenticatedAudio
          objectId={attachment.storage_object_id}
          filename={attachment.filename}
        />
        {showCaption ? <p className="whitespace-pre-wrap text-sm">{caption}</p> : null}
      </div>
    );
  }

  if (message.type === "audio") {
    return (
      <div className="flex min-w-48 items-center gap-2 rounded-md bg-black/5 px-3 py-2 text-sm text-muted-foreground">
        <Volume2 className="h-4 w-4 shrink-0" />
        <span>Voice note unavailable</span>
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
  if (message.type === "other" || isInstagramShareContent(message.content)) {
    return <InstagramOGLinkCard content={message.content} />;
  }
  return <p className="whitespace-pre-wrap text-sm">{message.content}</p>;
}

interface MessageBubbleProps {
  message: InboxChatMessage;
  /** Conversation channel, used to tint outbound bubbles. */
  channel?: InboxChannel;
  repliedTo?: {
    id: string;
    content: string;
  };
  highlighted?: boolean;
  onJumpToMessage?: (id: string) => void;
  onReply?: (message: InboxChatMessage) => void;
  onDelete?: (message: InboxChatMessage) => void;
  onRetry?: (clientMessageId: string) => void;
}

const MessageActions = forwardRef<
  HTMLDivElement,
  {
    open: boolean;
    onToggle: () => void;
    onReply: () => void;
    onDelete: () => void;
    canReply: boolean;
    canDelete: boolean;
    align?: "left" | "right";
  }
>(function MessageActions({ open, onToggle, onReply, onDelete, canReply, canDelete, align = "right" }, ref) {
  return (
    <div ref={ref} className="relative flex shrink-0 self-center">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
        title="Message actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute top-full z-20 mt-1 min-w-28 rounded-md border bg-background p-1 shadow-lg",
            align === "left" ? "left-0" : "right-0",
          )}
        >
          <button
            type="button"
            onClick={onReply}
            disabled={!canReply}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CornerUpLeft className="h-3.5 w-3.5" />
            Reply
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-destructive hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
});

export function MessageBubble({
  message,
  channel,
  repliedTo,
  highlighted = false,
  onJumpToMessage,
  onReply,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";
  const isFromWABusinessApp = message.source === "wa_business_app";
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const hasUnresolvedReply = Boolean(message.reply_to_wamid && !repliedTo);
  const senderLabel = !isOutbound
    ? null
    : isFromWABusinessApp
      ? "via WA Business App"
      : message.sender_name?.trim() || null;

  useEffect(() => {
    if (!actionsOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [actionsOpen]);

  return (
    <div className={cn("group flex w-full gap-1", isOutbound ? "justify-end" : "justify-start")}>
      {isOutbound ? (
        <MessageActions
          ref={actionsRef}
          open={actionsOpen}
          align="left"
          onToggle={() => setActionsOpen((prev) => !prev)}
          onReply={() => {
            setActionsOpen(false);
            onReply?.(message);
          }}
          onDelete={() => {
            setActionsOpen(false);
            onDelete?.(message);
          }}
          canReply={Boolean(message.wamid)}
          canDelete={!message.is_deleted}
        />
      ) : null}
      <div className={cn("flex w-fit max-w-[85%] flex-col", isOutbound ? "items-end" : "items-start")}>
        <div
          className={cn(
            "w-full rounded-2xl border px-3.5 py-2.5 shadow-sm transition-all",
            isOutbound ? "rounded-br-md" : "rounded-bl-md",
            bubbleClass(channel, isOutbound),
            highlighted ? "ring-2 ring-amber-400" : "",
          )}
        >
        {repliedTo ? (
          <button
            type="button"
            onClick={() => onJumpToMessage?.(repliedTo.id)}
            className="mb-2 block w-full rounded-md border-l-2 border-[#111111] bg-black/5 px-2 py-1 text-left text-xs text-[#6B7280] hover:bg-black/10 dark:border-foreground"
            title="Jump to replied message"
          >
            <p className="line-clamp-2 whitespace-pre-wrap">{repliedTo.content}</p>
          </button>
        ) : hasUnresolvedReply ? (
          <div
            className="mb-2 rounded-md border-l-2 border-amber-500 bg-black/5 px-2 py-1 text-left text-xs text-[#6B7280]"
            title="Original replied message is not available in loaded app history"
          >
            <p className="line-clamp-2 whitespace-pre-wrap italic">Reply to an earlier message (not available in app history)</p>
          </div>
        ) : null}
        {message.is_deleted ? (
          <p className="text-sm italic text-[#6B7280]">This message was deleted</p>
        ) : (
          <MediaPreview message={message} />
        )}

        <div
          className={cn(
            "mt-1.5 flex items-center gap-2 text-[10px] text-[#6B7280]",
            isOutbound ? "justify-end" : "justify-start",
          )}
        >
          {senderLabel ? (
            <span className="max-w-[10rem] truncate font-medium text-[#6B7280]" title={senderLabel}>
              {senderLabel}
            </span>
          ) : null}
          <span>{formatTime(message.sent_at)}</span>
          {isOutbound ? (
            message.send_status === "failed" ? (
              <button
                type="button"
                onClick={() => onRetry?.(message.client_message_id ?? message.id)}
                className="text-[10px] font-medium text-destructive hover:underline"
              >
                Failed · Retry
              </button>
            ) : message.send_status === "sending" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : message.read || message.send_status === "read" ? (
              <CheckCheck className="h-3 w-3 text-blue-500" />
            ) : message.delivered || message.send_status === "delivered" ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          ) : null}
        </div>
        {isOutbound && message.send_status === "failed" && message.send_error ? (
          <p className="mt-1 text-[10px] text-destructive">{message.send_error}</p>
        ) : null}
        </div>
      </div>
      {!isOutbound ? (
        <MessageActions
          ref={actionsRef}
          open={actionsOpen}
          onToggle={() => setActionsOpen((prev) => !prev)}
          onReply={() => {
            setActionsOpen(false);
            onReply?.(message);
          }}
          onDelete={() => {
            setActionsOpen(false);
            onDelete?.(message);
          }}
          canReply={Boolean(message.wamid)}
          canDelete={!message.is_deleted}
        />
      ) : null}
    </div>
  );
}


