"use client";

import { MoreHorizontal, UserPlus } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { providerLabel } from "@/components/shared/provider-badge";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/features/inbox/components/conversation-card";
import type { InboxConversation, InboxConversationStatus } from "@/features/inbox/types";
import { cn } from "@/lib/utils";
import type { ProviderKind } from "@/types/contact";

const STATUS_STYLES: Record<InboxConversationStatus, string> = {
  open: "bg-emerald-100 text-emerald-700 border-emerald-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  unassigned: "bg-amber-100 text-amber-700 border-amber-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

function statusLabel(status: InboxConversationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface ConversationHeaderProps {
  conversation: InboxConversation;
  presenceLabel?: string | null;
  onAssignClick: () => void;
  onMoreAction: (action: string) => void;
}

export function ConversationHeader({
  conversation,
  presenceLabel,
  onAssignClick,
  onMoreAction,
}: ConversationHeaderProps) {
  const displayStatus: InboxConversationStatus =
    conversation.status === "closed"
      ? "closed"
      : conversation.assigned_to
        ? "assigned"
        : conversation.status === "open"
          ? "open"
          : conversation.status;

  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <ContactAvatar name={conversation.contact_name} src={conversation.contact_avatar_url} size="lg" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background">
            <ChannelIcon channel={conversation.channel} className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {conversation.customer_name || conversation.contact_name || "Unknown contact"}
            </h2>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                STATUS_STYLES[displayStatus],
              )}
            >
              {statusLabel(displayStatus)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {providerLabel(conversation.channel as ProviderKind)} conversation
          </p>
          <TagBadgeList tags={conversation.tags} className="mt-1.5" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onAssignClick}>
          <UserPlus className="h-3.5 w-3.5" />
          Assign To
        </Button>
        <div className="relative">
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onMoreAction(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="" disabled>
              More
            </option>
            <option value="close">Close conversation</option>
            <option value="reopen">Reopen conversation</option>
            <option value="mark_unread">Mark as unread</option>
          </select>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
      {presenceLabel ? (
        <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">{presenceLabel}</div>
      ) : null}
    </div>
  );
}
