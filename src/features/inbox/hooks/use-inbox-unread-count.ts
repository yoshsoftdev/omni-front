"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { inboxUnreadCountQueryKey } from "@/features/inbox/query-keys";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";

function formatUnreadBadge(count: number) {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}

export function useInboxUnreadCount() {
  const token = useAuthStore((state) => state.tokens?.accessToken);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inboxUnreadCountQueryKey,
    queryFn: () => conversationService.unreadCount(),
    enabled: Boolean(token),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!token) return;

    websocketClient.connect(token);

    const unsubscribe = websocketClient.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "message.created" || payload.type === "conversation.updated") {
          void queryClient.invalidateQueries({ queryKey: inboxUnreadCountQueryKey });
        }
      } catch {
        // Ignore unrelated websocket events.
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token, queryClient]);

  return {
    count: query.data ?? 0,
    badge: formatUnreadBadge(query.data ?? 0),
    isLoading: query.isLoading,
  };
}
