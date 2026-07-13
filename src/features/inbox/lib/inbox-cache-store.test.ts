import { beforeEach, describe, expect, it } from "vitest";

import { useInboxCacheStore } from "@/features/inbox/store/inbox-cache-store";
import type { InboxConversation } from "@/features/inbox/types";

function conv(id: string, score = 0): InboxConversation {
  return {
    id,
    contact_id: `c-${id}`,
    contact_name: `Contact ${id}`,
    contact_phone: "+1",
    channel: "whatsapp",
    status: "open",
    unread_count: 0,
    priority_score: score,
    tags: [],
  };
}

describe("inbox-cache-store buckets", () => {
  beforeEach(() => {
    useInboxCacheStore.setState({ caches: {} });
  });

  it("keeps independent cache state per filterKey", () => {
    const store = useInboxCacheStore.getState();
    store.reset("normal", [conv("1", 10)], "cursor-a", true);
    store.reset("search:alice", [conv("2", 20)], null, false);

    const state = useInboxCacheStore.getState();
    expect(state.caches["normal"].orderedIds).toEqual(["1"]);
    expect(state.caches["search:alice"].orderedIds).toEqual(["2"]);
    expect(state.caches["normal"].nextCursor).toBe("cursor-a");
    expect(state.caches["search:alice"].nextCursor).toBeNull();
  });

  it("reorders only active bucket on delta", () => {
    const store = useInboxCacheStore.getState();
    store.reset("normal", [conv("1", 100), conv("2", 50)], "cursor-a", true);
    store.reset("search", [conv("2", 50)], null, false);

    store.applyDelta("normal", { conversation_id: "2", priority_score: 200 });

    const state = useInboxCacheStore.getState();
    expect(state.caches["normal"].orderedIds).toEqual(["2", "1"]);
    expect(state.caches["search"].orderedIds).toEqual(["2"]);
  });
});
