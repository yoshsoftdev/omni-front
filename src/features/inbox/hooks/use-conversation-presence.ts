"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  presenceService,
  type CollisionAgent,
  type CollisionSnapshot,
} from "@/features/inbox/services/presence.service";
import { useAuthStore } from "@/store/auth-store";

function excludeSelf(agents: CollisionAgent[], currentUserId?: string) {
  if (!currentUserId) return agents;
  return agents.filter((agent) => agent.agent_id !== currentUserId);
}

function formatAgentList(agents: CollisionAgent[], verb: string) {
  if (agents.length === 0) return null;
  if (agents.length === 1) return `${agents[0].agent_name} is ${verb}`;
  if (agents.length === 2) return `${agents[0].agent_name} and ${agents[1].agent_name} are ${verb}`;
  return `${agents[0].agent_name} and ${agents.length - 1} others are ${verb}`;
}

export function useConversationPresence(conversationId: string | null) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [viewers, setViewers] = useState<CollisionAgent[]>([]);
  const [typing, setTyping] = useState<CollisionAgent[]>([]);
  const previousConversationId = useRef<string | null>(null);

  const applySnapshot = useCallback((snapshot: CollisionSnapshot) => {
    if (!conversationId || snapshot.conversation_id !== conversationId) return;
    setViewers(snapshot.viewers ?? []);
    setTyping(snapshot.typing ?? []);
  }, [conversationId]);

  useEffect(() => {
    const previousId = previousConversationId.current;
    if (previousId && previousId !== conversationId) {
      void presenceService.close(previousId).catch(() => {});
    }

    if (!conversationId) {
      setViewers([]);
      setTyping([]);
      previousConversationId.current = null;
      return;
    }

    previousConversationId.current = conversationId;
    void presenceService.open(conversationId).then(applySnapshot).catch(() => {});
    void presenceService.get(conversationId).then(applySnapshot).catch(() => {});

    return () => {
      void presenceService.close(conversationId).catch(() => {});
    };
  }, [conversationId, applySnapshot]);

  const otherViewers = useMemo(
    () => excludeSelf(viewers, currentUserId),
    [viewers, currentUserId],
  );
  const otherTyping = useMemo(
    () => excludeSelf(typing, currentUserId),
    [typing, currentUserId],
  );

  const typingLabel = formatAgentList(otherTyping, "replying...");
  const viewerLabel = typingLabel ? null : formatAgentList(otherViewers, "viewing this conversation");

  const notifyTypingStart = useCallback(() => {
    if (!conversationId) return;
    void presenceService.typing(conversationId, "start").catch(() => {});
  }, [conversationId]);

  const notifyTypingStop = useCallback(() => {
    if (!conversationId) return;
    void presenceService.typing(conversationId, "stop").catch(() => {});
  }, [conversationId]);

  return {
    typingLabel,
    viewerLabel,
    applySnapshot,
    notifyTypingStart,
    notifyTypingStop,
  };
}
