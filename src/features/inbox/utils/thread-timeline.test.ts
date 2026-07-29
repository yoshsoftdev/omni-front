import { describe, expect, it } from "vitest";

import type { InboxActivityEvent, InboxChatMessage } from "@/features/inbox/types";
import { buildThreadTimeline } from "@/features/inbox/utils/thread-timeline";

function message(partial: Partial<InboxChatMessage> & { id: string; sent_at: string }): InboxChatMessage {
  return {
    conversation_id: "cv1",
    direction: "inbound",
    type: "text",
    content: "hi",
    ...partial,
  };
}

function activity(
  partial: Partial<InboxActivityEvent> & { id: string; created_at: string; type: InboxActivityEvent["type"] },
): InboxActivityEvent {
  return {
    description: "event",
    ...partial,
  };
}

describe("buildThreadTimeline", () => {
  it("merges messages and system events chronologically", () => {
    const items = buildThreadTimeline(
      [
        message({ id: "m1", sent_at: "2026-07-29T10:00:00Z", content: "hello" }),
        message({ id: "m2", sent_at: "2026-07-29T10:30:00Z", content: "thanks", direction: "outbound" }),
      ],
      [
        activity({
          id: "a1",
          type: "assigned",
          description: "Dita assigned conversation",
          created_at: "2026-07-29T10:15:00Z",
        }),
        activity({
          id: "a2",
          type: "agent_replied",
          description: "should skip",
          created_at: "2026-07-29T10:31:00Z",
        }),
      ],
    );

    const kinds = items.filter((item) => item.kind !== "date").map((item) => item.kind);
    expect(kinds).toEqual(["message", "system", "message"]);
    expect(items.some((item) => item.kind === "system" && item.data.type === "assigned")).toBe(true);
    expect(items.some((item) => item.kind === "system" && item.data.type === "agent_replied")).toBe(false);
  });

  it("inserts date separators between days", () => {
    const items = buildThreadTimeline(
      [
        message({ id: "m1", sent_at: "2026-07-28T10:00:00Z" }),
        message({ id: "m2", sent_at: "2026-07-29T10:00:00Z" }),
      ],
      [],
    );
    expect(items.filter((item) => item.kind === "date")).toHaveLength(2);
  });
});
