import { describe, expect, it } from "vitest";

import { formatWaitingLabel } from "@/features/inbox/hooks/use-waiting-label";

describe("formatWaitingLabel", () => {
  const now = new Date("2026-01-01T12:10:00Z").getTime();

  it("returns empty when no waiting_since", () => {
    expect(formatWaitingLabel(undefined, now)).toBe("");
  });

  it("formats sub-minute waits without rounding up", () => {
    expect(formatWaitingLabel("2026-01-01T12:09:30Z", now)).toBe("<1m");
  });

  it("formats minutes, hours and days", () => {
    expect(formatWaitingLabel("2026-01-01T12:08:00Z", now)).toBe("2m");
    expect(formatWaitingLabel("2026-01-01T11:55:00Z", now)).toBe("15m");
    expect(formatWaitingLabel("2026-01-01T09:55:00Z", now)).toBe("2h 15m");
    expect(formatWaitingLabel("2026-01-01T10:10:00Z", now)).toBe("2h");
    expect(formatWaitingLabel("2025-12-30T12:10:00Z", now)).toBe("2d");
  });
});
