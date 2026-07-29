import { describe, expect, it } from "vitest";

import { formatWaitingClock, formatWaitingLabel } from "@/features/inbox/utils/format-waiting";

describe("formatWaitingLabel", () => {
  const now = Date.parse("2026-07-29T12:00:00.000Z");

  it("returns empty for missing values", () => {
    expect(formatWaitingLabel(undefined, now)).toBe("");
    expect(formatWaitingLabel("not-a-date", now)).toBe("");
  });

  it("formats under one minute", () => {
    expect(formatWaitingLabel("2026-07-29T11:59:30.000Z", now)).toBe("<1m");
  });

  it("formats minutes and hours", () => {
    expect(formatWaitingLabel("2026-07-29T11:58:00.000Z", now)).toBe("2m");
    expect(formatWaitingLabel("2026-07-29T10:00:00.000Z", now)).toBe("2h");
    expect(formatWaitingLabel("2026-07-29T09:45:00.000Z", now)).toBe("2h 15m");
  });
});

describe("formatWaitingClock", () => {
  const now = Date.parse("2026-07-29T12:00:00.000Z");

  it("formats HH:MM:SS", () => {
    expect(formatWaitingClock("2026-07-29T09:46:30.000Z", now)).toBe("02:13:30");
  });
});
