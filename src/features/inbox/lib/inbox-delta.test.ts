import { describe, expect, it } from "vitest";

import { mergeDelta, mergeDeltas } from "@/features/inbox/lib/inbox-delta";
import type { InboxConversation } from "@/features/inbox/types";

describe("mergeDelta", () => {
  it("merges partial websocket delta into existing conversation", () => {
    const existing: InboxConversation = {
      id: "1",
      contact_id: "c1",
      contact_name: "Alice",
      contact_phone: "+1",
      channel: "whatsapp",
      status: "open",
      unread_count: 2,
      priority_score: 100,
      tags: [],
    };
    const merged = mergeDelta(existing, {
      conversation_id: "1",
      unread_count: 3,
      priority_score: 250,
      last_message: "Hello",
    });
    expect(merged.unread_count).toBe(3);
    expect(merged.priority_score).toBe(250);
    expect(merged.last_message_preview).toBe("Hello");
    expect(merged.contact_name).toBe("Alice");
  });

  it("preserves provider context and never defaults unknown deltas to WhatsApp", () => {
    const created = mergeDelta(undefined, {
      conversation_id: "instagram-conversation",
      provider: "instagram",
      provider_profile_id: "profile-1",
      linked_providers: ["whatsapp", "instagram"],
      linked_account_count: 2,
    });
    expect(created.channel).toBe("instagram");
    expect(created.provider_profile_id).toBe("profile-1");
    expect(created.linked_providers).toEqual(["whatsapp", "instagram"]);

    const unknown = mergeDelta(undefined, { conversation_id: "future-provider" });
    expect(unknown.channel).toBe("unknown");
  });
});

describe("mergeDeltas", () => {
  it("batches multiple deltas for the same conversation", () => {
    const merged = mergeDeltas([
      { conversation_id: "1", unread_count: 2 },
      { conversation_id: "1", priority_score: 90, last_message: "Hi" },
      { conversation_id: "2", unread_count: 1 },
    ]);
    expect(merged.get("1")).toMatchObject({ unread_count: 2, priority_score: 90, last_message: "Hi" });
    expect(merged.get("2")).toMatchObject({ unread_count: 1 });
  });
});
