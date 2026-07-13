import { describe, expect, it } from "vitest";

import {
  compareConversations,
  findInsertIndex,
  reorderConversation,
} from "@/features/inbox/lib/inbox-order";
import type { InboxConversation } from "@/features/inbox/types";

function conv(partial: Partial<InboxConversation> & { id: string }): InboxConversation {
  return {
    contact_id: "c1",
    contact_name: "Test",
    contact_phone: "+1",
    channel: "whatsapp",
    status: "open",
    unread_count: 0,
    tags: [],
    priority_score: 0,
    ...partial,
  };
}

describe("compareConversations", () => {
  it("orders by priority_score desc", () => {
    const a = conv({ id: "a", priority_score: 100 });
    const b = conv({ id: "b", priority_score: 200 });
    expect(compareConversations(a, b)).toBeGreaterThan(0);
  });

  it("orders by last_message_at when scores tie", () => {
    const a = conv({ id: "a", priority_score: 10, last_message_at: "2026-01-01T10:00:00Z" });
    const b = conv({ id: "b", priority_score: 10, last_message_at: "2026-01-01T11:00:00Z" });
    expect(compareConversations(a, b)).toBeGreaterThan(0);
  });
});

describe("reorderConversation", () => {
  it("moves only the affected conversation when priority changes", () => {
    const byId = {
      a: conv({ id: "a", priority_score: 300 }),
      b: conv({ id: "b", priority_score: 200 }),
      c: conv({ id: "c", priority_score: 100 }),
    };
    let orderedIds = ["a", "b", "c"];
    const updated = conv({ id: "c", priority_score: 400, last_message_at: "2026-01-02T00:00:00Z" });
    orderedIds = reorderConversation(orderedIds, byId, updated);
    expect(orderedIds).toEqual(["c", "a", "b"]);
  });

  it("inserts at correct index for new conversation", () => {
    const byId = {
      a: conv({ id: "a", priority_score: 200 }),
      b: conv({ id: "b", priority_score: 100 }),
    };
    const orderedIds = ["a", "b"];
    const created = conv({ id: "n", priority_score: 150 });
    const index = findInsertIndex(orderedIds, byId, created);
    expect(index).toBe(1);
  });
});
