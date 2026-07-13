import { describe, expect, it } from "vitest";

import { formatWaitingLabel } from "@/features/inbox/hooks/use-waiting-label";

describe("formatWaitingLabel", () => {
  const now = new Date("2026-01-01T12:10:00Z").getTime();

  it("returns empty when no waiting_since", () => {
    expect(formatWaitingLabel(undefined, now)).toBe("");
  });

  it("uses visual buckets", () => {
    expect(formatWaitingLabel("2026-01-01T12:09:30Z", now)).toBe("1m");
    expect(formatWaitingLabel("2026-01-01T12:08:00Z", now)).toBe("2m");
    expect(formatWaitingLabel("2026-01-01T12:05:00Z", now)).toBe("5m");
    expect(formatWaitingLabel("2026-01-01T11:55:00Z", now)).toBe("15m");
  });
});
