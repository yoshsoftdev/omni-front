"use client";

import { useEffect, useRef } from "react";

import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { InboxActivityEvent, InboxWorkspaceNote } from "@/features/inbox/types";
import type { CollisionSnapshot } from "@/features/inbox/services/presence.service";
import {
  extractConversationId,
  extractStatusFromRealtimeData,
} from "@/features/inbox/utils/realtime-conversation";

interface InboxRealtimeHandlers {
  onMessageCreated?: (message: Message) => void;
  onMessageStatusUpdated?: (payload: {
    message_id?: string;
    client_message_id?: string;
    conversation_id?: string;
    status?: string;
  }) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onConversationStatusChange?: (conversationId: string, status: "open" | "closed") => void;
  onActivityCreated?: (activity: InboxActivityEvent, conversationId?: string) => void;
  onNoteCreated?: (note: InboxWorkspaceNote, conversationId?: string) => void;
  onCollisionUpdate?: (snapshot: CollisionSnapshot) => void;
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

function mapCollisionSnapshot(data: Record<string, unknown>): CollisionSnapshot | null {
  const conversationId = String(data.conversation_id ?? "").trim();
  if (!conversationId) return null;
  const mapAgents = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => {
            const record = item as Record<string, unknown>;
            const agentId = String(record.agent_id ?? record.agentId ?? "").trim();
            if (!agentId) return null;
            return {
              agent_id: agentId,
              agent_name: String(record.agent_name ?? record.agentName ?? "Agent"),
            };
          })
          .filter(Boolean)
      : [];
  return {
    conversation_id: conversationId,
    agent_id: String(data.agent_id ?? ""),
    agent_name: String(data.agent_name ?? ""),
    viewers: mapAgents(data.viewers) as CollisionSnapshot["viewers"],
    typing: mapAgents(data.typing) as CollisionSnapshot["typing"],
  };
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

        if (payload.type === "message.status.updated") {
          handlers.onMessageStatusUpdated?.({
            message_id: String(data.message_id ?? ""),
            client_message_id: String(data.client_message_id ?? ""),
            conversation_id: String(data.conversation_id ?? ""),
            status: String(data.status ?? ""),
          });
        }

        if (
          payload.type === "conversation.opened" ||
          payload.type === "conversation.view.closed" ||
          payload.type === "agent.typing.start" ||
          payload.type === "agent.typing.stop"
        ) {
          const snapshot = mapCollisionSnapshot(data);
          if (snapshot) handlers.onCollisionUpdate?.(snapshot);
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
