"use client";

import { useEffect, useRef } from "react";

import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";

interface InboxRealtimeHandlers {
  onMessageCreated?: (message: Message) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
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
        const payload = JSON.parse(event.data) as { type?: string; data?: unknown };
        if (payload.type === "message.created" && payload.data) {
          handlersRef.current.onMessageCreated?.(payload.data as Message);
        }
        if (payload.type === "conversation.updated" && payload.data) {
          handlersRef.current.onConversationUpdated?.(payload.data as Conversation);
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
