import { describe, expect, it } from "vitest";

import { mapConversationToInbox, mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import type { Conversation } from "@/types/conversation";
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

describe("mapConversationToInbox channel", () => {
  const base = { id: "c1", contact_id: "k1" } as Conversation;

  it.each([
    ["whatsapp", "whatsapp"],
    ["meta_whatsapp", "whatsapp"],
    ["META", "whatsapp"],
    ["ig", "instagram"],
    ["instagram", "instagram"],
    [undefined, "unknown"],
  ])("maps channel_type %s to %s", (channelType, expected) => {
    const mapped = mapConversationToInbox({ ...base, channel_type: channelType } as Conversation);
    expect(mapped.channel).toBe(expected);
  });
});
