"use client";

import { Instagram, Mail, MessageCircle, Send } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { AssigneeChip } from "@/features/inbox/components/shared/conversation-meta-chips";
import { useWaitingLabel } from "@/features/inbox/hooks/use-waiting-label";
import { cn } from "@/lib/utils";
import type { InboxChannel, InboxConversation } from "@/features/inbox/types";

function ChannelIcon({ channel, className }: { channel: InboxChannel; className?: string }) {
  const props = { className: className ?? "h-3.5 w-3.5" };
  if (channel === "whatsapp") return <MessageCircle {...props} className={cn(props.className, "text-emerald-700")} />;
  if (channel === "instagram") return <Instagram {...props} className={cn(props.className, "text-fuchsia-700")} />;
  if (channel === "messenger") return <Send {...props} className={cn(props.className, "text-blue-700")} />;
  return <Mail {...props} className={cn(props.className, "text-[#6B7280]")} />;
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

function displayName(conversation: InboxConversation) {
  return (
    conversation.customer_name?.trim() ||
    conversation.contact_name?.trim() ||
    conversation.contact_phone ||
    "Unknown"
  );
}

interface ConversationCardProps {
  conversation: InboxConversation;
  selected: boolean;
  onSelect: () => void;
}

export function ConversationCard({ conversation, selected, onSelect }: ConversationCardProps) {
  const waitingLabel = useWaitingLabel(conversation.waiting_since);
  const name = displayName(conversation);
  const preview = conversation.last_message_preview?.trim() || "No messages yet";
  const timeLabel = waitingLabel || formatTimestamp(conversation.last_message_at);
  const unread = conversation.unread_count > 0 ? conversation.unread_count : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${name}, ${conversation.status === "closed" ? "Closed" : "Open"}, ${
        conversation.assignee_name?.trim() || "Unassigned"
      }${unread ? `, ${unread} unread` : ""}`}
      className={cn(
        "flex w-full items-start gap-3 border-b border-l-2 border-[#E5E7EB] border-l-transparent px-3 py-3 text-left transition-colors hover:bg-[#F6F7F9] dark:border-border dark:border-l-transparent dark:hover:bg-muted/40",
        selected && "border-l-[#111111] bg-[#F6F7F9] dark:border-l-foreground dark:bg-muted/50",
      )}
    >
      <div className="relative shrink-0 pt-0.5">
        <ContactAvatar name={name} src={conversation.contact_avatar_url} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-card">
          <ChannelIcon channel={conversation.channel} className="h-3 w-3" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold leading-5 text-[#111111] dark:text-foreground">
            {name}
          </span>
          {timeLabel ? (
            <span
              className={cn(
                "shrink-0 text-[11px] leading-5 tabular-nums",
                waitingLabel ? "font-medium text-amber-700 dark:text-amber-400" : "text-[#6B7280]",
              )}
              title={waitingLabel ? `Waiting ${waitingLabel}` : undefined}
            >
              {waitingLabel ? waitingLabel : timeLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex items-center">
          <AssigneeChip
            name={conversation.assignee_name}
            className="max-w-full px-1.5 py-0 text-[10px] leading-[18px]"
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="line-clamp-1 min-w-0 flex-1 text-xs leading-4 text-[#6B7280]">{preview}</p>
          {unread > 0 ? (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[10px] font-semibold text-white dark:bg-foreground dark:text-background">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export { ChannelIcon, formatTimestamp };
