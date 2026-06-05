"use client";

import { useCallback, useEffect, useState } from "react";

import { inboxService } from "@/features/inbox/services/inbox.service";
import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";
import type { InboxEvent, InboxMessage } from "@/types/inbox";

function mergeMessages(existing: InboxMessage[], incoming: InboxMessage) {
  if (existing.some((m) => m.id === incoming.id)) {
    return existing;
  }
  return [incoming, ...existing].slice(0, 100);
}

export function useInboxFeed() {
  const token = useAuthStore((state) => state.tokens?.accessToken);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setError(null);
    try {
      const data = await inboxService.listMessages();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    loadMessages();
    websocketClient.connect(token);

    const unsubscribe = websocketClient.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data) as InboxEvent;
        if (payload?.type !== "inbox.message") return;
        if (!payload.data) return;

        setMessages((prev) => mergeMessages(prev, payload.data as InboxMessage));
      } catch {
        // Ignore non-JSON / unrelated WS events.
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token, loadMessages]);

  return { messages, loading, error, reload: loadMessages };
}
