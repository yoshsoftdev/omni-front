import { describe, expect, it } from "vitest";

import { mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import type { Message } from "@/types/message";

describe("mapMessageToInbox", () => {
  it("maps story mention payload to other message type", () => {
    const message: Message = {
      id: "m1",
      conversation_id: "c1",
      direction: "inbound",
      content: "Mentioned your story",
      content_type: "other",
      sender_phone: "123",
      sent_at: new Date().toISOString(),
    };

    const mapped = mapMessageToInbox(message);
    expect(mapped.type).toBe("other");
    expect(mapped.content).toBe("Mentioned your story");
  });

  it("maps shared ig post content", () => {
    const message: Message = {
      id: "m2",
      conversation_id: "c1",
      direction: "inbound",
      content: "Shared a post\nAI that works with humans",
      content_type: "other",
      sender_phone: "123",
      sent_at: new Date().toISOString(),
    };

    const mapped = mapMessageToInbox(message);
    expect(mapped.type).toBe("other");
    expect(mapped.content).toContain("Shared a post");
  });
});
