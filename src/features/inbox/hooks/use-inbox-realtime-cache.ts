"use client";

import { useEffect, useRef } from "react";

import type { ConversationDelta } from "@/features/inbox/lib/inbox-delta";
import { mergeDeltas } from "@/features/inbox/lib/inbox-delta";
import { useInboxCacheStore } from "@/features/inbox/store/inbox-cache-store";
import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";

const CONVERSATION_EVENTS = new Set([
  "conversation.created",
  "conversation.updated",
  "conversation.deleted",
  "conversation.assigned",
  "conversation.unread_changed",
  "conversation.closed",
  "conversation.reopened",
  "conversation.reassigned",
]);

function parseDelta(data: Record<string, unknown>): ConversationDelta | null {
  const conversationId = String(data.conversation_id ?? data.id ?? data.ID ?? "").trim();
  if (!conversationId) return null;

  return {
    conversation_id: conversationId,
    last_message: typeof data.last_message === "string" ? data.last_message : undefined,
    last_message_preview: typeof data.last_message_preview === "string" ? data.last_message_preview : undefined,
    last_message_at: typeof data.last_message_at === "string" ? data.last_message_at : undefined,
    priority_score: typeof data.priority_score === "number" ? data.priority_score : undefined,
    waiting_since: typeof data.waiting_since === "string" ? data.waiting_since : undefined,
    unread_count: typeof data.unread_count === "number" ? data.unread_count : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    assigned_to: typeof data.assigned_to === "string" ? data.assigned_to : undefined,
    contact_id: typeof data.contact_id === "string" ? data.contact_id : undefined,
    contact_name: typeof data.contact_name === "string" ? data.contact_name : undefined,
    contact_phone: typeof data.contact_phone === "string" ? data.contact_phone : undefined,
  };
}

export function useInboxRealtimeCache(filterKey: string) {
  const token = useAuthStore((state) => state.tokens?.accessToken);
  const applyDeltas = useInboxCacheStore((state) => state.applyDeltas);
  const remove = useInboxCacheStore((state) => state.remove);

  const pendingRef = useRef<Map<string, ConversationDelta>>(new Map());
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    websocketClient.connect(token);

    const flush = () => {
      frameRef.current = null;
      const batch = Array.from(mergeDeltas(Array.from(pendingRef.current.values())).values());
      pendingRef.current.clear();
      if (batch.length === 0) return;
      applyDeltas(filterKey, batch);
    };

    const scheduleFlush = () => {
      if (frameRef.current != null) return;
      frameRef.current = window.requestAnimationFrame(flush);
    };

    const unsubscribe = websocketClient.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; data?: Record<string, unknown> };
        if (!payload.type || !payload.data) return;
        if (!CONVERSATION_EVENTS.has(payload.type)) return;

        if (payload.type === "conversation.deleted") {
          const id = String(payload.data.conversation_id ?? payload.data.id ?? "").trim();
          if (id) remove(filterKey, id);
          return;
        }

        const delta = parseDelta(payload.data);
        if (!delta?.conversation_id) return;
        pendingRef.current.set(delta.conversation_id, {
          ...pendingRef.current.get(delta.conversation_id),
          ...delta,
        });
        scheduleFlush();
      } catch {
        // Ignore unrelated websocket events.
      }
    });

    return () => {
      unsubscribe();
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [token, applyDeltas, remove, filterKey]);
}
