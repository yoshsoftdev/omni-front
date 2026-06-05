"use client";

import { dedupeMessages } from "@/features/inbox/utils/messages";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";

interface MessageThreadProps {
  messages: Message[];
  loading: boolean;
}

export function MessageThread({ messages, loading }: MessageThreadProps) {
  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading messages...</p>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        No messages in this conversation yet.
      </div>
    );
  }

  const uniqueMessages = dedupeMessages(messages);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {uniqueMessages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "max-w-[75%] rounded-lg px-3 py-2 text-sm",
            message.direction === "outbound"
              ? "ml-auto bg-primary text-primary-foreground"
              : "mr-auto border bg-background",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          <p
            className={cn(
              "mt-1 text-[10px]",
              message.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {new Date(message.sent_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
