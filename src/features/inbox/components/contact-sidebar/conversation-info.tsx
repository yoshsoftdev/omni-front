"use client";

import type { ReactNode } from "react";

import { ChannelPlatformBadge } from "@/features/inbox/components/shared/channel-platform-badge";
import { useWaitingClock } from "@/features/inbox/hooks/use-waiting-label";
import type { InboxConversation } from "@/features/inbox/types";
import { resolvePriorityLabel } from "@/features/inbox/utils/priority-label";

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-[#6B7280]">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-[#111111] dark:text-foreground">{children}</dd>
    </div>
  );
}

interface ConversationInfoProps {
  conversation: InboxConversation;
  channelLabel?: string;
}

export function ConversationInfo({ conversation, channelLabel }: ConversationInfoProps) {
  const waitingClock = useWaitingClock(conversation.waiting_since);
  const priority = resolvePriorityLabel(conversation);
  const isClosed = conversation.status === "closed";
  const assignee =
    conversation.assignee_name?.trim() ||
    (conversation.assigned_to ? "Assigned agent" : "Unassigned");
  const channelName = channelLabel?.trim();

  return (
    <section aria-labelledby="conversation-info-heading">
      <h4
        id="conversation-info-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]"
      >
        Conversation
      </h4>
      <dl className="space-y-2.5">
        <InfoRow label="Status">{isClosed ? "Closed" : "Open"}</InfoRow>
        <InfoRow label="Assigned To">{assignee}</InfoRow>
        <InfoRow label="Priority">{priority ?? "—"}</InfoRow>
        <InfoRow label="Waiting Time">{waitingClock ? `Waiting ${waitingClock}` : "—"}</InfoRow>
        <InfoRow label="Channel">
          <span className="inline-flex items-center justify-end gap-1.5">
            <ChannelPlatformBadge channelType={conversation.channel} className="h-5" />
            <span>{channelName || "—"}</span>
          </span>
        </InfoRow>
        <InfoRow label="Conversation ID">
          <span className="break-all font-mono text-[11px] font-normal text-[#6B7280]">
            {conversation.id}
          </span>
        </InfoRow>
      </dl>
    </section>
  );
}
