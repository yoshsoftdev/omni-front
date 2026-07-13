import { create } from "zustand";

import { reorderConversation } from "@/features/inbox/lib/inbox-order";
import { mergeDelta, type ConversationDelta } from "@/features/inbox/lib/inbox-delta";
import type { InboxConversation } from "@/features/inbox/types";

export interface InboxCacheBucket {
  byId: Record<string, InboxConversation>;
  orderedIds: string[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface InboxCacheState {
  caches: Record<string, InboxCacheBucket>;
  reset: (
    filterKey: string,
    conversations: InboxConversation[],
    nextCursor: string | null,
    hasMore: boolean,
  ) => void;
  appendPage: (filterKey: string, conversations: InboxConversation[], nextCursor: string | null, hasMore: boolean) => void;
  applyDelta: (filterKey: string, delta: ConversationDelta) => void;
  applyDeltas: (filterKey: string, deltas: ConversationDelta[]) => void;
  remove: (filterKey: string, conversationId: string) => void;
}

function mergeUnique(existing: InboxConversation[], incoming: InboxConversation[]): InboxConversation[] {
  const map = new Map<string, InboxConversation>();
  for (const item of existing) {
    map.set(item.id, item);
  }
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

function buildOrderedIds(byId: Record<string, InboxConversation>, conversations: InboxConversation[]): string[] {
  let orderedIds: string[] = [];
  for (const conversation of conversations) {
    byId[conversation.id] = conversation;
    orderedIds = reorderConversation(orderedIds, byId, conversation);
  }
  return orderedIds;
}

function createEmptyBucket(): InboxCacheBucket {
  return {
    byId: {},
    orderedIds: [],
    nextCursor: null,
    hasMore: false,
  };
}

export const useInboxCacheStore = create<InboxCacheState>((set, get) => ({
  caches: {},

  reset(filterKey, conversations, nextCursor, hasMore) {
    const byId: Record<string, InboxConversation> = {};
    const orderedIds = buildOrderedIds(byId, conversations);
    set((state) => ({
      caches: {
        ...state.caches,
        [filterKey]: { byId, orderedIds, nextCursor, hasMore },
      },
    }));
  },

  appendPage(filterKey, conversations, nextCursor, hasMore) {
    const state = get();
    const bucket = state.caches[filterKey] ?? createEmptyBucket();
    const merged = mergeUnique(
      bucket.orderedIds.map((id) => bucket.byId[id]).filter(Boolean),
      conversations,
    );
    const byId = { ...bucket.byId };
    const orderedIds = buildOrderedIds(byId, merged);
    set((current) => ({
      caches: {
        ...current.caches,
        [filterKey]: { byId, orderedIds, nextCursor, hasMore },
      },
    }));
  },

  applyDelta(filterKey, delta) {
    get().applyDeltas(filterKey, [delta]);
  },

  applyDeltas(filterKey, deltas) {
    if (deltas.length === 0) return;
    const state = get();
    const bucket = state.caches[filterKey] ?? createEmptyBucket();
    const byId = { ...bucket.byId };
    let orderedIds = [...bucket.orderedIds];

    for (const delta of deltas) {
      const id = (delta.conversation_id ?? delta.id ?? "").trim();
      if (!id) continue;
      const merged = mergeDelta(byId[id], delta);
      byId[id] = merged;
      orderedIds = reorderConversation(orderedIds, byId, merged);
    }

    set((current) => ({
      caches: {
        ...current.caches,
        [filterKey]: { ...bucket, byId, orderedIds },
      },
    }));
  },

  remove(filterKey, conversationId) {
    const state = get();
    const bucket = state.caches[filterKey];
    if (!bucket || !bucket.byId[conversationId]) return;
    const byId = { ...bucket.byId };
    delete byId[conversationId];
    set((current) => ({
      caches: {
        ...current.caches,
        [filterKey]: {
          ...bucket,
          byId,
          orderedIds: bucket.orderedIds.filter((id) => id !== conversationId),
        },
      },
    }));
  },
}));
