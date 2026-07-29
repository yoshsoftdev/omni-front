import { describe, expect, it } from "vitest";

import { channelTypeToProvider, platformShortCode } from "@/features/inbox/utils/channel-display";

describe("platformShortCode", () => {
  it("maps known platforms", () => {
    expect(platformShortCode("whatsapp")).toBe("WA");
    expect(platformShortCode("instagram")).toBe("IG");
    expect(platformShortCode("messenger")).toBe("FB");
    expect(platformShortCode("telegram")).toBe("TG");
  });
});

describe("channelTypeToProvider", () => {
  it("normalizes aliases", () => {
    expect(channelTypeToProvider("ig")).toBe("instagram");
    expect(channelTypeToProvider("facebook")).toBe("messenger");
    expect(channelTypeToProvider("meta_whatsapp")).toBe("whatsapp");
  });
});
