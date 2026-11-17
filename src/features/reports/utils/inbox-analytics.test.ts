import { describe, expect, it } from "vitest";

import { formatDuration, lastDaysRange } from "@/features/reports/utils/inbox-analytics";

describe("formatDuration", () => {
  it("uses the two largest units", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(150)).toBe("2m 30s");
    expect(formatDuration(120)).toBe("2m");
    expect(formatDuration(7380)).toBe("2h 3m");
    expect(formatDuration(200000)).toBe("2d 7h");
    expect(formatDuration(null)).toBe("—");
  });
});

describe("lastDaysRange", () => {
  it("covers whole local days ending today", () => {
    const { from, to } = lastDaysRange(7, new Date(2026, 10, 16, 15, 30));
    expect(to).toEqual(new Date(2026, 10, 17));
    expect(from).toEqual(new Date(2026, 10, 10));
  });
});
