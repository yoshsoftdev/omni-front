import { describe, expect, it } from "vitest";

import type { Channel } from "@/features/channels/types/channel";
import {
  formatConnectionMethod,
  formatSecondaryIdentifier,
  getChannelKind,
  kindLabel,
} from "@/features/channels/utils/channel-display";

function channel(partial: Partial<Channel>): Channel {
  return {
    id: "1",
    label: "Test",
    provider: "meta",
    status: "connected",
    is_coex: false,
    ...partial,
  };
}

describe("getChannelKind", () => {
  it("detects whatsapp from channel_type", () => {
    expect(getChannelKind(channel({ channel_type: "whatsapp" }))).toBe("whatsapp");
  });

  it("detects instagram from channel_type", () => {
    expect(getChannelKind(channel({ channel_type: "instagram" }))).toBe("instagram");
  });

  it("detects messenger from channel_type", () => {
    expect(getChannelKind(channel({ channel_type: "messenger" }))).toBe("messenger");
  });

  it("falls back to whatsapp when waba_id present", () => {
    expect(getChannelKind(channel({ waba_id: "waba-1" }))).toBe("whatsapp");
  });

  it("defaults to messenger when unknown", () => {
    expect(getChannelKind(channel({}))).toBe("messenger");
  });
});

describe("formatSecondaryIdentifier", () => {
  it("prefers phone number for whatsapp", () => {
    expect(
      formatSecondaryIdentifier(
        channel({ phone_number: "+62811", phone_number_id: "pid", waba_id: "waba" }),
        "whatsapp",
      ),
    ).toBe("+62811");
  });

  it("prefixes @ for instagram handles", () => {
    expect(formatSecondaryIdentifier(channel({ phone_number: "dgos.official" }), "instagram")).toBe(
      "@dgos.official",
    );
  });

  it("keeps existing @ for instagram", () => {
    expect(formatSecondaryIdentifier(channel({ phone_number: "@already" }), "instagram")).toBe(
      "@already",
    );
  });
});

describe("formatConnectionMethod", () => {
  it("maps embedded_coex", () => {
    expect(formatConnectionMethod("embedded_coex")).toBe("Embedded Signup (CoEx)");
  });

  it("maps manual", () => {
    expect(formatConnectionMethod("manual")).toBe("Manual Setup");
  });
});

describe("kindLabel", () => {
  it("labels messenger as Messenger", () => {
    expect(kindLabel("messenger")).toBe("Messenger");
  });
});
