import type { InboxChannel } from "@/features/inbox/types";

/** Inbound messages always stay neutral so the customer voice reads the same everywhere. */
export const INBOUND_BUBBLE_CLASS =
  "border-[#E5E7EB] bg-white text-[#111111] dark:border-border dark:bg-card dark:text-foreground";

const NEUTRAL_OUTBOUND_CLASS =
  "border-[#E5E7EB] bg-[#F6F7F9] text-[#111111] dark:border-border dark:bg-muted/40 dark:text-foreground";

/**
 * Outbound bubbles are tinted by channel so an agent can tell at a glance which
 * platform a reply left through. Tints stay light with dark text to keep WCAG AA.
 */
const OUTBOUND_BUBBLE_CLASS: Record<string, string> = {
  whatsapp:
    "border-emerald-200 bg-emerald-50 text-[#111111] dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-foreground",
  instagram:
    "border-purple-200 bg-purple-50 text-[#111111] dark:border-purple-900 dark:bg-purple-950/40 dark:text-foreground",
  messenger:
    "border-blue-200 bg-blue-50 text-[#111111] dark:border-blue-900 dark:bg-blue-950/40 dark:text-foreground",
  telegram:
    "border-sky-200 bg-sky-50 text-[#111111] dark:border-sky-900 dark:bg-sky-950/40 dark:text-foreground",
};

export function outboundBubbleClass(channel?: InboxChannel): string {
  if (!channel) return NEUTRAL_OUTBOUND_CLASS;
  return OUTBOUND_BUBBLE_CLASS[channel.toLowerCase()] ?? NEUTRAL_OUTBOUND_CLASS;
}

export function bubbleClass(channel: InboxChannel | undefined, isOutbound: boolean): string {
  return isOutbound ? outboundBubbleClass(channel) : INBOUND_BUBBLE_CLASS;
}
