"use client";

import { Instagram, Mail, MessageCircle, Send } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { useWaitingLabel } from "@/features/inbox/hooks/use-waiting-label";
import { cn } from "@/lib/utils";
import type { InboxChannel, InboxConversation } from "@/features/inbox/types";

function ChannelIcon({ channel, className }: { channel: InboxChannel; className?: string }) {
  const props = { className: className ?? "h-3.5 w-3.5" };
  if (channel === "whatsapp") return <MessageCircle {...props} className={cn(props.className, "text-emerald-600")} />;
  if (channel === "instagram") return <Instagram {...props} className={cn(props.className, "text-pink-600")} />;
  if (channel === "messenger") return <Send {...props} className={cn(props.className, "text-blue-600")} />;
  return <Mail {...props} className={cn(props.className, "text-slate-500")} />;
}

function formatTimestamp(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ConversationCardProps {
  conversation: InboxConversation;
  selected: boolean;
  onSelect: () => void;
}

export function ConversationCard({ conversation, selected, onSelect }: ConversationCardProps) {
  const waitingLabel = useWaitingLabel(conversation.waiting_since);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/40",
        selected && "bg-primary/5 border-l-2 border-l-primary",
      )}
    >
      <div className="relative shrink-0">
        <ContactAvatar name={conversation.contact_name} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background">
          <ChannelIcon channel={conversation.channel} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold">{conversation.contact_name}</span>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-[11px] text-muted-foreground">
              {formatTimestamp(conversation.last_message_at)}
            </span>
            {waitingLabel ? (
              <span className="text-[10px] font-medium text-amber-600">{waitingLabel}</span>
            ) : null}
          </div>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {conversation.last_message_preview?.trim() || "No messages yet"}
        </p>
      </div>

      {conversation.unread_count > 0 ? (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {conversation.unread_count}
        </span>
      ) : null}
    </button>
  );
}

export { ChannelIcon, formatTimestamp };
