"use client";

import { useEffect, useRef } from "react";

import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { InboxActivityEvent, InboxWorkspaceNote } from "@/features/inbox/types";
import {
  extractConversationId,
  extractStatusFromRealtimeData,
} from "@/features/inbox/utils/realtime-conversation";

interface InboxRealtimeHandlers {
  onMessageCreated?: (message: Message) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onConversationStatusChange?: (conversationId: string, status: "open" | "closed") => void;
  onActivityCreated?: (activity: InboxActivityEvent, conversationId?: string) => void;
  onNoteCreated?: (note: InboxWorkspaceNote, conversationId?: string) => void;
}

const ACTIVITY_EVENTS = new Set([
  "conversation.assigned",
  "conversation.reassigned",
  "conversation.closed",
  "conversation.reopened",
]);

function mapRealtimeActivity(payload: Record<string, unknown>): InboxActivityEvent | null {
  const id = String(payload.id ?? payload.ID ?? "");
  if (!id) return null;
  return {
    id,
    type: (payload.type ?? payload.Type ?? "opened") as InboxActivityEvent["type"],
    description: String(payload.description ?? payload.Description ?? ""),
    created_at: String(payload.created_at ?? payload.CreatedAt ?? new Date().toISOString()),
  };
}

function mapRealtimeNote(payload: Record<string, unknown>): InboxWorkspaceNote | null {
  const id = String(payload.id ?? payload.ID ?? "");
  if (!id) return null;
  return {
    id,
    category: "internal",
    content: String(payload.content ?? payload.Content ?? ""),
    author: String(payload.author_name ?? payload.AuthorName ?? "Agent"),
    created_at: String(payload.created_at ?? payload.CreatedAt ?? new Date().toISOString()),
  };
}

function notifyStatusChange(
  handlers: InboxRealtimeHandlers,
  data: Record<string, unknown>,
  eventType?: string,
) {
  const conversationId = extractConversationId(data);
  const status = extractStatusFromRealtimeData(data, eventType);
  if (conversationId && status) {
    handlers.onConversationStatusChange?.(conversationId, status);
  }
}

export function useInboxRealtime(handlers: InboxRealtimeHandlers) {
  const token = useAuthStore((state) => state.tokens?.accessToken);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;

    websocketClient.connect(token);

    const unsubscribe = websocketClient.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; data?: Record<string, unknown> };
        if (!payload.data) return;

        const data = payload.data;
        const handlers = handlersRef.current;

        if (payload.type === "message.created") {
          handlers.onMessageCreated?.(data as unknown as Message);
        }

        if (payload.type === "conversation.updated") {
          handlers.onConversationUpdated?.(data as unknown as Conversation);
          notifyStatusChange(handlers, data, payload.type);
        }

        if (payload.type === "conversation.closed" || payload.type === "conversation.reopened") {
          notifyStatusChange(handlers, data, payload.type);
        }

        if (payload.type === "conversation.note.created") {
          const note = mapRealtimeNote(data);
          const conversationId = extractConversationId(data);
          if (note) {
            handlers.onNoteCreated?.(note, conversationId || undefined);
          }
        }

        if (payload.type && ACTIVITY_EVENTS.has(payload.type)) {
          const activity = mapRealtimeActivity(data);
          const conversationId = extractConversationId(data);
          if (activity) {
            handlers.onActivityCreated?.(activity, conversationId || undefined);
            notifyStatusChange(handlers, data, payload.type);
          }
        }
      } catch {
        // Ignore unrelated websocket events.
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token]);
}
