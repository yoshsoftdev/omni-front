import { describe, expect, it } from "vitest";

import type { InboxConversation } from "@/features/inbox/types";
import { resolvePriorityLabel } from "@/features/inbox/utils/priority-label";

function conv(partial: Partial<InboxConversation>): InboxConversation {
  return {
    id: "1",
    contact_id: "c",
    contact_name: "A",
    contact_phone: "+1",
    channel: "whatsapp",
    status: "open",
    unread_count: 0,
    tags: [],
    ...partial,
  };
}

describe("resolvePriorityLabel", () => {
  it("prefers VIP-like tags", () => {
    expect(
      resolvePriorityLabel(
        conv({ tags: [{ id: "t1", name: "VIP", color: "#000" }], priority_score: 10 }),
      ),
    ).toBe("VIP");
  });

  it("falls back to score bands", () => {
    expect(resolvePriorityLabel(conv({ priority_score: 90 }))).toBe("High");
    expect(resolvePriorityLabel(conv({ priority_score: 55 }))).toBe("Medium");
    expect(resolvePriorityLabel(conv({ priority_score: 0 }))).toBeNull();
  });
});
