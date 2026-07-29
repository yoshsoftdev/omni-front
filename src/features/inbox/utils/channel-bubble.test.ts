import { describe, expect, it } from "vitest";

import {
  INBOUND_BUBBLE_CLASS,
  bubbleClass,
  outboundBubbleClass,
} from "@/features/inbox/utils/channel-bubble";

describe("outboundBubbleClass", () => {
  it("tints whatsapp green, instagram purple and messenger blue", () => {
    expect(outboundBubbleClass("whatsapp")).toContain("bg-emerald-50");
    expect(outboundBubbleClass("instagram")).toContain("bg-purple-50");
    expect(outboundBubbleClass("messenger")).toContain("bg-blue-50");
  });

  it("is case insensitive", () => {
    expect(outboundBubbleClass("WhatsApp")).toBe(outboundBubbleClass("whatsapp"));
  });

  it("falls back to a neutral tint for unknown or missing channels", () => {
    expect(outboundBubbleClass("carrier-pigeon")).toContain("bg-[#F6F7F9]");
    expect(outboundBubbleClass(undefined)).toContain("bg-[#F6F7F9]");
  });

  it("keeps dark text on every tint for contrast", () => {
    for (const channel of ["whatsapp", "instagram", "messenger", "telegram", "email"]) {
      expect(outboundBubbleClass(channel)).toContain("text-[#111111]");
    }
  });
});

describe("bubbleClass", () => {
  it("keeps inbound bubbles white regardless of channel", () => {
    expect(bubbleClass("instagram", false)).toBe(INBOUND_BUBBLE_CLASS);
    expect(INBOUND_BUBBLE_CLASS).toContain("bg-white");
  });

  it("uses the channel tint for outbound bubbles", () => {
    expect(bubbleClass("whatsapp", true)).toBe(outboundBubbleClass("whatsapp"));
  });
});
