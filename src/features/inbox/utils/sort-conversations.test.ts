import { describe, expect, it } from "vitest";

import type { InboxConversation } from "@/features/inbox/types";
import { sortConversations } from "@/features/inbox/utils/sort-conversations";

function conv(partial: Partial<InboxConversation> & { id: string }): InboxConversation {
  return {
    contact_id: "c1",
    contact_name: "A",
    contact_phone: "+1",
    channel: "whatsapp",
    status: "open",
    unread_count: 0,
    tags: [],
    ...partial,
  };
}

describe("sortConversations", () => {
  it("sorts by recent activity", () => {
    const sorted = sortConversations(
      [
        conv({ id: "1", last_message_at: "2026-07-29T10:00:00Z" }),
        conv({ id: "2", last_message_at: "2026-07-29T12:00:00Z" }),
      ],
      "recent",
    );
    expect(sorted.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("sorts waiting longest first", () => {
    const sorted = sortConversations(
      [
        conv({ id: "new", waiting_since: "2026-07-29T11:50:00Z", last_message_at: "2026-07-29T12:00:00Z" }),
        conv({ id: "old", waiting_since: "2026-07-29T10:00:00Z", last_message_at: "2026-07-29T11:00:00Z" }),
        conv({ id: "none", last_message_at: "2026-07-29T12:30:00Z" }),
      ],
      "waiting",
    );
    expect(sorted.map((c) => c.id)).toEqual(["old", "new", "none"]);
  });
});
