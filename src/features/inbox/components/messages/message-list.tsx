"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { MessageBubble } from "@/features/inbox/components/message-bubble";
import { SystemEvent } from "@/features/inbox/components/messages/system-event";
import { useThreadTimeline } from "@/features/inbox/hooks/use-thread-timeline";
import type { InboxActivityEvent, InboxChannel, InboxChatMessage } from "@/features/inbox/types";
import { normalizeWamidForMatch } from "@/features/inbox/utils/wamid";

interface MessageListProps {
  messages: InboxChatMessage[];
  /** Conversation channel, used to tint outbound bubbles. */
  channel?: InboxChannel;
  activities?: InboxActivityEvent[];
  onReply?: (message: InboxChatMessage) => void;
  onDelete?: (message: InboxChatMessage) => void;
  onRetry?: (clientMessageId: string) => void;
}

export function MessageList({
  messages,
  channel,
  activities = [],
  onReply,
  onDelete,
  onRetry,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const timeline = useThreadTimeline(messages, activities);

  const byWAMID = new Map<string, { id: string; content: string }>();
  for (const msg of messages) {
    const key = normalizeWamidForMatch(msg.wamid);
    if (key) {
      byWAMID.set(key, { id: msg.id, content: msg.content });
    }
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [timeline]);

  function jumpToMessage(id: string) {
    const el = document.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(id);
    window.setTimeout(() => setHighlightedMessageId((prev) => (prev === id ? null : prev)), 1800);
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="inbox-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F6F7F9] p-4 dark:bg-muted/20"
    >
      {timeline.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No messages yet.</p>
      ) : (
        timeline.map((item) => {
          if (item.kind === "date") {
            return (
              <div key={item.id} className="flex justify-center py-1">
                <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-0.5 text-[11px] text-[#6B7280] dark:border-border dark:bg-card">
                  {item.label}
                </span>
              </div>
            );
          }

          if (item.kind === "system") {
            return <SystemEvent key={item.id} event={item.data} />;
          }

          const message = item.data;
          const repliedTo =
            (message.reply_to_message_id
              ? messages.find((m) => m.id === message.reply_to_message_id)
              : undefined) ??
            (message.reply_to_wamid
              ? byWAMID.get(normalizeWamidForMatch(message.reply_to_wamid))
              : undefined);

          return (
            <div key={message.id} data-message-id={message.id} role="listitem">
              <MessageBubble
                message={message}
                channel={channel}
                repliedTo={repliedTo}
                highlighted={highlightedMessageId === message.id}
                onJumpToMessage={jumpToMessage}
                onReply={onReply}
                onDelete={onDelete}
                onRetry={onRetry}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
