"use client";

import { Check, CheckCheck, FileText, Image as ImageIcon, Video } from "lucide-react";
import { useEffect, useRef } from "react";

import type { InboxChatMessage } from "@/features/inbox/types";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function MediaPreview({ message }: { message: InboxChatMessage }) {
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
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm",
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
