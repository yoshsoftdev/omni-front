"use client";

import { ArrowLeft, Instagram, Mail, MessageCircle, MoreHorizontal, PanelRight, Send, Tag, UserPlus } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChannelPlatformBadge } from "@/features/inbox/components/shared/channel-platform-badge";
import {
  AssigneeChip,
  ConversationStatusChip,
  PriorityChip,
  ReplyWindowChip,
  WaitingChip,
} from "@/features/inbox/components/shared/conversation-meta-chips";
import { useWaitingClock } from "@/features/inbox/hooks/use-waiting-label";
import type { InboxChannel, InboxConversation } from "@/features/inbox/types";
import type { FreeTextWindowState } from "@/features/inbox/utils/free-text-window";
import { resolvePriorityLabel } from "@/features/inbox/utils/priority-label";
import { cn } from "@/lib/utils";

function ChannelIcon({ channel, className }: { channel: InboxChannel; className?: string }) {
  const props = { className: className ?? "h-3.5 w-3.5" };
  if (channel === "whatsapp") return <MessageCircle {...props} className={cn(props.className, "text-success-foreground")} />;
  if (channel === "instagram") return <Instagram {...props} className={cn(props.className, "text-fuchsia-700")} />;
  if (channel === "messenger") return <Send {...props} className={cn(props.className, "text-info-foreground")} />;
  return <Mail {...props} className={cn(props.className, "text-muted-foreground")} />;
}

interface ConversationHeaderProps {
  conversation: InboxConversation;
  channelLabel?: string;
  presenceLabel?: string | null;
  replyWindow?: FreeTextWindowState;
  onAssignClick: () => void;
  onTagClick?: () => void;
  onMoreAction: (action: string) => void;
  onBack?: () => void;
  onOpenContext?: () => void;
}

export function ConversationHeader({
  conversation,
  channelLabel,
  presenceLabel,
  replyWindow,
  onAssignClick,
  onTagClick,
  onMoreAction,
  onBack,
  onOpenContext,
}: ConversationHeaderProps) {
  const waitingClock = useWaitingClock(conversation.waiting_since);
  const priority = resolvePriorityLabel(conversation);
  const customerName =
    conversation.customer_name?.trim() ||
    conversation.contact_name?.trim() ||
    conversation.contact_phone ||
    "Unknown contact";
  const channelName = channelLabel?.trim();

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-card">
      <div className="flex items-start justify-between gap-3 px-3 py-3 md:px-4">
        <div className="flex min-w-0 items-start gap-2 md:gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-background md:hidden dark:hover:bg-muted"
              aria-label="Back to conversation list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div className="relative shrink-0">
            <ContactAvatar name={customerName} src={conversation.contact_avatar_url} size="lg" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-card">
              <ChannelIcon channel={conversation.channel} className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="min-w-0 space-y-2">
            <h2 className="truncate text-base font-semibold text-foreground">
              {customerName}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5">
              <ConversationStatusChip status={conversation.status} />
              <AssigneeChip name={conversation.assignee_name} />
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground dark:bg-muted">
                <ChannelPlatformBadge channelType={conversation.channel} className="h-5 border-0 bg-transparent px-0" />
                <span className="truncate">{channelName || "Channel"}</span>
              </span>
              {priority ? <PriorityChip label={priority} /> : null}
              {waitingClock ? <WaitingChip label={waitingClock} /> : null}
              {replyWindow?.applies ? (
                <ReplyWindowChip allowed={replyWindow.allowed} remainingMs={replyWindow.remainingMs} />
              ) : null}
            </div>

            {conversation.tags.length > 0 ? (
              <TagBadgeList tags={conversation.tags} className="pt-0.5" />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {onOpenContext ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 2xl:hidden"
              onClick={onOpenContext}
              aria-label="Open conversation context"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAssignClick}>
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Assign</span>
          </Button>
          {onTagClick ? (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onTagClick}>
              <Tag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tag</span>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="More conversation actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {conversation.status === "closed" ? (
                <DropdownMenuItem onSelect={() => onMoreAction("reopen")}>Reopen conversation</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onMoreAction("close")}>Close conversation</DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => onMoreAction("mark_unread")}>Mark as unread</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {presenceLabel ? (
        <div className="border-t border-border bg-background px-4 py-2 text-xs text-muted-foreground dark:bg-muted/40">
          {presenceLabel}
        </div>
      ) : null}
    </header>
  );
}

export { ChannelIcon };
