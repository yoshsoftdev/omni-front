import { describe, expect, it } from "vitest";

import {
  FREE_TEXT_WINDOW_MS,
  channelUsesFreeTextWindow,
  getFreeTextWindowState,
  isFreeTextWindowOpen,
  resolveLastCustomerMessageAt,
} from "@/features/inbox/utils/free-text-window";

const NOW = Date.parse("2026-07-29T12:00:00Z");

describe("channelUsesFreeTextWindow", () => {
  it("applies to Meta messaging channels only", () => {
    expect(channelUsesFreeTextWindow("whatsapp")).toBe(true);
    expect(channelUsesFreeTextWindow("instagram")).toBe(true);
    expect(channelUsesFreeTextWindow("messenger")).toBe(true);
    expect(channelUsesFreeTextWindow("email")).toBe(false);
    expect(channelUsesFreeTextWindow("telegram")).toBe(false);
  });
});

describe("resolveLastCustomerMessageAt", () => {
  it("prefers the newest inbound message over a stale conversation field", () => {
    expect(
      resolveLastCustomerMessageAt("2026-07-28T10:00:00Z", [
        { direction: "outbound", sent_at: "2026-07-29T11:00:00Z" },
        { direction: "inbound", sent_at: "2026-07-29T11:30:00Z" },
      ]),
    ).toBe("2026-07-29T11:30:00Z");
  });

  it("keeps the conversation field when it is newer than loaded messages", () => {
    expect(
      resolveLastCustomerMessageAt("2026-07-29T11:45:00Z", [
        { direction: "inbound", sent_at: "2026-07-29T10:00:00Z" },
      ]),
    ).toBe("2026-07-29T11:45:00Z");
  });
});

describe("isFreeTextWindowOpen", () => {
  it("is open inside 24 hours and closed afterwards", () => {
    expect(isFreeTextWindowOpen("2026-07-28T12:00:01Z", NOW)).toBe(true);
    expect(isFreeTextWindowOpen("2026-07-28T12:00:00Z", NOW)).toBe(false);
    expect(isFreeTextWindowOpen(undefined, NOW)).toBe(false);
  });
});

describe("getFreeTextWindowState", () => {
  it("always allows free text on channels without a messaging window", () => {
    const state = getFreeTextWindowState({
      channel: "email",
      lastCustomerMessageAt: undefined,
      now: NOW,
    });
    expect(state.allowed).toBe(true);
    expect(state.applies).toBe(false);
  });

  it("blocks free text when the WhatsApp window has expired", () => {
    const state = getFreeTextWindowState({
      channel: "whatsapp",
      lastCustomerMessageAt: "2026-07-28T11:00:00Z",
      now: NOW,
    });
    expect(state.allowed).toBe(false);
    expect(state.applies).toBe(true);
    expect(state.remainingMs).toBe(0);
  });

  it("reports remaining time while the window is still open", () => {
    const start = NOW - FREE_TEXT_WINDOW_MS + 60_000;
    const state = getFreeTextWindowState({
      channel: "instagram",
      lastCustomerMessageAt: new Date(start).toISOString(),
      now: NOW,
    });
    expect(state.allowed).toBe(true);
    expect(state.remainingMs).toBe(60_000);
  });
});
