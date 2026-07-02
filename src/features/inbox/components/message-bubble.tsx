"use client";

import { Check, CheckCheck, Download, FileText, Image as ImageIcon, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  downloadAuthenticatedMedia,
  formatBytes,
  useAuthenticatedMediaUrl,
} from "@/features/inbox/hooks/use-authenticated-media";
import type { InboxChatMessage } from "@/features/inbox/types";
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
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  return (
    <div className={cn("flex w-full flex-col", isOutbound ? "items-end" : "items-start")}>
      <div
        className={cn(
          "w-fit max-w-[90%] rounded-2xl px-3.5 py-2.5 shadow-sm",
          isOutbound
            ? "rounded-br-md bg-emerald-100 text-foreground"
            : "rounded-bl-md border bg-background",
        )}
      >
        <MediaPreview message={message} />
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] text-muted-foreground",
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
      {isOutbound && message.sender_name ? (
        <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
          — {message.sender_name}
        </p>
      ) : null}
    </div>
  );
}

interface MessageThreadProps {
  messages: InboxChatMessage[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  let lastLabel = "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? "smooth" : "auto",
      block: "end",
    });
  }, [messages]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        messages.map((message) => {
          const showLabel = message.date_label && message.date_label !== lastLabel;
          if (message.date_label) lastLabel = message.date_label;

          return (
            <div key={message.id}>
              {showLabel ? (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] text-muted-foreground">
                    {message.date_label}
                  </span>
                </div>
              ) : null}
              <MessageBubble message={message} />
            </div>
          );
        })
      )}
      <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
    </div>
  );
}
