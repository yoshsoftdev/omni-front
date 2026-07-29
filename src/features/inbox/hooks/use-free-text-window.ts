"use client";

import { useEffect, useMemo, useState } from "react";

import type { InboxChannel, InboxChatMessage } from "@/features/inbox/types";
import {
  getFreeTextWindowState,
  type FreeTextWindowState,
} from "@/features/inbox/utils/free-text-window";

/**
 * Live Meta free-text window. Re-evaluates every 30s so the Send button flips
 * off when the 24h customer-care window expires while the inbox stays open.
 */
export function useFreeTextWindow(
  channel: InboxChannel | undefined,
  lastCustomerMessageAt: string | undefined,
  messages: Array<Pick<InboxChatMessage, "direction" | "sent_at">> = [],
): FreeTextWindowState {
  const [now, setNow] = useState(() => Date.now());

  const applies = channel === "whatsapp" || channel === "instagram" || channel === "messenger";

  useEffect(() => {
    if (!applies) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [applies]);

  return useMemo(
    () => getFreeTextWindowState({ channel, lastCustomerMessageAt, messages, now }),
    [channel, lastCustomerMessageAt, messages, now],
  );
}
