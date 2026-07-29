import type { InboxChannel, InboxChatMessage } from "@/features/inbox/types";

/** Meta customer-care window for free-form replies (WhatsApp / Instagram / Messenger). */
export const FREE_TEXT_WINDOW_MS = 24 * 60 * 60 * 1000;

const WINDOWED_CHANNELS = new Set(["whatsapp", "instagram", "messenger"]);

export function channelUsesFreeTextWindow(channel?: InboxChannel): boolean {
  if (!channel) return false;
  return WINDOWED_CHANNELS.has(channel.toLowerCase());
}

/**
 * Prefer the conversation field from the API; fall back to the newest inbound
 * message already loaded in the thread (covers realtime updates before a refetch).
 */
export function resolveLastCustomerMessageAt(
  lastCustomerMessageAt: string | undefined,
  messages: Array<Pick<InboxChatMessage, "direction" | "sent_at">> = [],
): string | undefined {
  let latest = lastCustomerMessageAt?.trim() || undefined;
  let latestMs = latest ? Date.parse(latest) : Number.NaN;

  for (const message of messages) {
    if (message.direction !== "inbound") continue;
    const ms = Date.parse(message.sent_at);
    if (Number.isNaN(ms)) continue;
    if (Number.isNaN(latestMs) || ms > latestMs) {
      latestMs = ms;
      latest = message.sent_at;
    }
  }

  return latest;
}

export function isFreeTextWindowOpen(
  lastCustomerMessageAt: string | undefined,
  now = Date.now(),
): boolean {
  if (!lastCustomerMessageAt) return false;
  const start = Date.parse(lastCustomerMessageAt);
  if (Number.isNaN(start)) return false;
  return now - start < FREE_TEXT_WINDOW_MS;
}

export function freeTextWindowRemainingMs(
  lastCustomerMessageAt: string | undefined,
  now = Date.now(),
): number {
  if (!lastCustomerMessageAt) return 0;
  const start = Date.parse(lastCustomerMessageAt);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, start + FREE_TEXT_WINDOW_MS - now);
}

export interface FreeTextWindowState {
  /** Whether free-text (and media) replies may be sent on this channel. */
  allowed: boolean;
  /** True when this channel is subject to the Meta 24h rule. */
  applies: boolean;
  lastCustomerMessageAt?: string;
  remainingMs: number;
}

export function getFreeTextWindowState(input: {
  channel?: InboxChannel;
  lastCustomerMessageAt?: string;
  messages?: Array<Pick<InboxChatMessage, "direction" | "sent_at">>;
  now?: number;
}): FreeTextWindowState {
  const now = input.now ?? Date.now();
  const applies = channelUsesFreeTextWindow(input.channel);
  const lastCustomerMessageAt = resolveLastCustomerMessageAt(
    input.lastCustomerMessageAt,
    input.messages,
  );

  if (!applies) {
    return { allowed: true, applies: false, lastCustomerMessageAt, remainingMs: 0 };
  }

  const allowed = isFreeTextWindowOpen(lastCustomerMessageAt, now);
  return {
    allowed,
    applies: true,
    lastCustomerMessageAt,
    remainingMs: freeTextWindowRemainingMs(lastCustomerMessageAt, now),
  };
}
